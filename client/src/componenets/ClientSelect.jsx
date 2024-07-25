import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

const ClientSelect = ({ value, onChange }) => {
    const { accessToken } = useAuth()
    const [clients, setClients] = useState([]);

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const response = await fetch('/api/clients/fetch_client_names', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch clients');
                }
                const clientData = await response.json();
                setClients(clientData);
            } catch (error) {
                console.error('Error fetching clients:', error);
            }
        };

        fetchClients();
    }, [accessToken]);

    return (
        <div className="form-group">
            <label htmlFor="client">Client</label>
            <select
                className="form-control"
                id="client"
                name="client"
                value={value}
                onChange={onChange}
                required
            >
                <option value="">Select Client</option>
                {clients.map((client, index) => (
                    <option key={index} value={client}>
                        {client}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default ClientSelect;
