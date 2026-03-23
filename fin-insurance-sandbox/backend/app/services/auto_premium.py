"""
Monthly Automatic Premium Deduction Service
Handles scheduled premium deductions from customer accounts
"""

import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from sqlalchemy.orm import Session
import asyncio
from decimal import Decimal
import traceback

from app.models.policy import Policy
from app.models.premium_deduction import PremiumDeduction
from app.models.customer import Customer
from app.core.exceptions import ServiceError, ValidationError
from app.core.database import get_db
from app.services.notification_service import NotificationService
from app.services.payment_gateway import PaymentGateway

# Configure logging
logger = logging.getLogger(__name__)

class AutoPremiumDeductionService:
    """
    Service for handling monthly automatic premium deductions
    """

    def __init__(self, db: Session, payment_gateway: PaymentGateway, notification_service: NotificationService):
        self.db = db
        self.payment_gateway = payment_gateway
        self.notification = notification_service

    async def process_monthly_deductions(self, batch_date: Optional[datetime] = None) -> Dict[str, any]:
        """
        Process all pending premium deductions for the month
        """
        if not batch_date:
            batch_date = datetime.now()

        logger.info(f"Starting monthly automatic premium deduction: {batch_date}")

        try:
            # Get active policies due for payment
            policies = await self._get_eligible_policies()
            logger.info(f"Found {len(policies)} policies eligible for monthly deduction")

            results = {
                'total_processed': 0,
                'successful': 0,
                'failed': 0,
                'total_amount': Decimal('0'),
                'errors': []
            }

            # Process in batches to avoid overwhelming the payment gateway
            batch_size = 50
            for i in range(0, len(policies), batch_size):
                batch = policies[i:i + batch_size]
                batch_results = await self._process_batch(batch, batch_date)

                results['total_processed'] += batch_results['processed']
                results['successful'] += batch_results['successful']
                results['failed'] += batch_results['failed']
                results['total_amount'] += batch_results['total_amount']
                results['errors'].extend(batch_results['errors'])

                # Brief pause between batches
                if i + batch_size < len(policies):
                    await asyncio.sleep(1)

            # Generate summary report
            await self._generate_summary_report(results)

            return results

        except Exception as e:
            logger.error(f"Critical error in process_monthly_deductions: {str(e)}")
            logger.error(traceback.format_exc())
            raise ServiceError(f"Monthly deduction processing failed: {str(e)}")

    async def _get_eligible_policies(self) -> List[Policy]:
        """
        Retrieve policies eligible for monthly premium deduction
        """
        try:
            current_date = datetime.now()

            query = (
                self.db.query(Policy)
                .join(Customer)
                .filter(
                    Policy.status == 'ACTIVE',
                    Policy.payment_status == 'PENDING',
                    Policy.next_payment_date <= current_date,
                    Customer.auto_pay_enabled == True,
                    Customer.account_balance >= Policy.premium_amount  # Ensure sufficient balance
                )
                .order_by(Policy.next_payment_date.asc())
            )

            return query.all()

        except Exception as e:
            logger.error(f"Error retrieving eligible policies: {str(e)}")
            raise ServiceError(f"Failed to retrieve policies: {str(e)}")

    async def _process_batch(self, policies: List[Policy], batch_date: datetime) -> Dict[str, any]:
        """
        Process a batch of policies for payment
        """
        results = {
            'processed': 0,
            'successful': 0,
            'failed': 0,
            'total_amount': Decimal('0'),
            'errors': []
        }

        for policy in policies:
            try:
                result = await self._process_single_policy(policy, batch_date)

                results['processed'] += 1
                if result['success']:
                    results['successful'] += 1
                    results['total_amount'] += Decimal(str(policy.premium_amount))
                else:
                    results['failed'] += 1
                    results['errors'].append(result['error'])

            except Exception as e:
                results['failed'] += 1
                results['errors'].append({
                    'policy_id': policy.id,
                    'customer_id': policy.customer_id,
                    'error': str(e)
                })
                logger.error(f"Error processing policy {policy.id}: {str(e)}")

        return results

    async def _process_single_policy(self, policy: Policy, batch_date: datetime) -> Dict[str, any]:
        """
        Process a single premium deduction for a policy
        """
        try:
            # Validate policy state
            validation_result = await self._validate_policy_for_deduction(policy)
            if not validation_result['valid']:
                return {'success': False, 'error': validation_result['error']}

            # Attempt payment
            payment_result = await self._initiate_payment(policy, batch_date)

            if payment_result['success']:
                # Record successful deduction
                await self._record_successful_deduction(policy, payment_result['transaction_id'], batch_date)

                # Update policy dates
                await self._update_policy_payment_date(policy)

                # Send confirmation notification
                await self.notification.send_payment_success_notification(
                    customer_id=policy.customer_id,
                    amount=policy.premium_amount,
                    policy_number=policy.policy_number
                )

                return {'success': True, 'transaction_id': payment_result['transaction_id']}
            else:
                # Handle payment failure
                await self._handle_payment_failure(policy, payment_result['error'])

                # Send failure notification
                await self.notification.send_payment_failure_notification(
                    customer_id=policy.customer_id,
                    amount=policy.premium_amount,
                    policy_number=policy.policy_number,
                    error=payment_result['error']
                )

                return {
                    'success': False,
                    'error': {
                        'policy_id': policy.id,
                        'customer_id': policy.customer_id,
                        'error': payment_result['error']
                    }
                }

        except Exception as e:
            logger.error(f"Error in _process_single_policy for policy {policy.id}: {str(e)}")
            return {
                'success': False,
                'error': {
                    'policy_id': policy.id,
                    'customer_id': policy.customer_id,
                    'error': str(e)
                }
            }

    async def _validate_policy_for_deduction(self, policy: Policy) -> Dict[str, any]:
        """
        Validate if policy is ready for deduction
        """
        try:
            # Check customer has sufficient balance
            if policy.customer.account_balance < policy.premium_amount:
                return {
                    'valid': False,
                    'error': {
                        'policy_id': policy.id,
                        'customer_id': policy.customer_id,
                        'error': 'Insufficient account balance'
                    }
                }

            # Check if already processed this month
            existing_deduction = self.db.query(PremiumDeduction).filter(
                PremiumDeduction.policy_id == policy.id,
                PremiumDeduction.deduction_date.month == datetime.now().month,
                PremiumDeduction.deduction_date.year == datetime.now().year
            ).first()

            if existing_deduction and existing_deduction.status == 'COMPLETED':
                return {
                    'valid': False,
                    'error': {
                        'policy_id': policy.id,
                        'customer_id': policy.customer_id,
                        'error': 'Already processed for this month'
                    }
                }

            return {'valid': True}

        except Exception as e:
            logger.error(f"Validation error for policy {policy.id}: {str(e)}")
            return {'valid': False, 'error': str(e)}

    async def _initiate_payment(self, policy: Policy, batch_date: datetime) -> Dict[str, any]:
        """
        Initiate payment through payment gateway
        """
        try:
            payment_data = {
                'customer_id': policy.customer_id,
                'amount': float(policy.premium_amount),
                'currency': 'USD',
                'description': f'Monthly premium - Policy {policy.policy_number}',
                'reference': f'PREMIUM_{policy.id}_{batch_date.strftime("%Y%m%d")}'
            }

            result = await self.payment_gateway.charge(payment_data)

            if result.get('success'):
                return {
                    'success': True,
                    'transaction_id': result.get('transaction_id')
                }
            else:
                return {
                    'success': False,
                    'error': result.get('error', 'Payment declined')
                }

        except Exception as e:
            logger.error(f"Payment initiation failed for policy {policy.id}: {str(e)}")
            return {
                'success': False,
                'error': f"Payment gateway error: {str(e)}"
            }

    async def _record_successful_deduction(self, policy: Policy, transaction_id: str, batch_date: datetime):
        """
        Record successful premium deduction
        """
        try:
            deduction = PremiumDeduction(
                policy_id=policy.id,
                customer_id=policy.customer_id,
                amount=policy.premium_amount,
                transaction_id=transaction_id,
                deduction_date=batch_date,
                status='COMPLETED',
                processed_at=datetime.now()
            )

            self.db.add(deduction)
            self.db.commit()

            # Update customer balances
            policy.customer.account_balance -= policy.premium_amount
            self.db.add(policy.customer)
            self.db.commit()

        except Exception as e:
            logger.error(f"Error recording successful deduction: {str(e)}")
            self.db.rollback()
            raise

    async def _handle_payment_failure(self, policy: Policy, error_details: Dict[str, str]):
        """
        Handle payment failure and update records
        """
        try:
            deduction = PremiumDeduction(
                policy_id=policy.id,
                customer_id=policy.customer_id,
                amount=policy.premium_amount,
                deduction_date=datetime.now(),
                status='FAILED',
                error_message=str(error_details),
                processed_at=datetime.now()
            )

            self.db.add(deduction)

            # Update policy payment retry count
            if hasattr(policy, 'payment_retry_count'):
                policy.payment_retry_count += 1

            self.db.commit()

        except Exception as e:
            logger.error(f"Error handling payment failure: {str(e)}")
            self.db.rollback()

    async def _update_policy_payment_date(self, policy: Policy):
        """
        Update policy next payment date after successful deduction
        """
        try:
            # Advance next payment date by one month
            if policy.payment_frequency == 'monthly':
                policy.next_payment_date = policy.next_payment_date + timedelta(days=30)
            elif policy.payment_frequency == 'quarterly':
                policy.next_payment_date = policy.next_payment_date + timedelta(days=90)
            elif policy.payment_frequency == 'annual':
                policy.next_payment_date = policy.next_payment_date + timedelta(days=365)

            policy.last_payment_date = datetime.now()

            self.db.add(policy)
            self.db.commit()

        except Exception as e:
            logger.error(f"Error updating policy payment date: {str(e)}")
            self.db.rollback()

    async def _generate_summary_report(self, results: Dict[str, any]):
        """
        Generate and store summary report for the batch process
        """
        try:
            report = {
                'report_date': datetime.now(),
                'total_policies': results['total_processed'],
                'successful_deductions': results['successful'],
                'failed_deductions': results['failed'],
                'total_amount_collected': float(results['total_amount']),
                'error_summary': results['errors'][:10]  # First 10 errors only
            }

            logger.info(f"Monthly deduction summary: {report}")

        except Exception as e:
            logger.error(f"Error generating summary report: {str(e)}")

    async def retry_failed_payments(self, policy_id: Optional[int] = None) -> Dict[str, any]:
        """
        Retry failed premium deductions
        """
        try:
            query = self.db.query(Policy).join(PremiumDeduction).filter(
                PremiumDeduction.status == 'FAILED'
            )

            if policy_id:
                query = query.filter(Policy.id == policy_id)

            failed_policies = query.all()

            results = {
                'total_retries': 0,
                'successful': 0,
                'failed': 0
            }

            for policy in failed_policies:
                result = self._process_single_policy(policy, datetime.now())

                results['total_retries'] += 1
                if result['success']:
                    results['successful'] += 1
                else:
                    results['failed'] += 1

            return results

        except Exception as e:
            logger.error(f"Error in retry failed payments: {str(e)}")
            raise ServiceError(f"Retry failed payments error: {str(e)}")

# Utility function for scheduled execution
async def run_monthly_deduction():
    """
    Entry point for scheduled monthly deduction job
    """
    try:
        db = next(get_db())
        payment_gateway = PaymentGateway()
        notification_service = NotificationService(db)

        service = AutoPremiumDeductionService(
            db=db,
            payment_gateway=payment_gateway,
            notification_service=notification_service
        )

        results = await service.process_monthly_deductions()

        logger.info("Monthly deduction job completed successfully")
        return results

    except Exception as e:
        logger.error(f"Scheduled job failed: {str(e)}")
        raise
