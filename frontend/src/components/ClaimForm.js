import React, { useState } from 'react';
import { TextField, Button, Container, Typography, Box } from '@mui/material';
import { claimService } from '../services/api';

const ClaimForm = ({ onSuccess }) => {
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        type: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await claimService.createClaim(formData);
            if (response.data) {
                onSuccess(response.data);
                setFormData({ description: '', amount: '', type: '' });
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create claim');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 4 }}>
                <Typography variant="h4" gutterBottom>
                    File New Claim
                </Typography>

                {error && (
                    <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                        {error}
                    </Typography>
                )}

                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        margin="normal"
                        name="description"
                        label="Description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        multiline
                        rows={4}
                    />

                    <TextField
                        fullWidth
                        margin="normal"
                        name="amount"
                        label="Amount"
                        type="number"
                        value={formData.amount}
                        onChange={handleChange}
                        required
                    />

                    <TextField
                        fullWidth
                        margin="normal"
                        name="type"
                        label="Claim Type"
                        value={formData.type}
                        onChange={handleChange}
                        required
                    />

                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        disabled={loading}
                        sx={{ mt: 2 }}
                    >
                        {loading ? 'Submitting...' : 'Submit Claim'}
                    </Button>
                </form>
            </Box>
        </Container>
    );
};

export default ClaimForm;
