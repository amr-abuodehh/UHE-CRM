import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

const UserSelect = ({ value, onChange }) => {
    const [users, setUsers] = useState([]);
    const { accessToken } = useAuth()

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('/api/users/fetch_usernames', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch users');
                }
                const userData = await response.json();
                setUsers(userData);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        fetchUsers();
    }, [accessToken]);

    return (
        <div className="form-group">
            <label htmlFor="assigned_to">Assigned To</label>
            <select
                className="form-control"
                id="assigned_to"
                name="assigned_to"
                value={value}
                onChange={onChange}
                required
            >
                <option value="">Select User</option>
                {users.map((user, index) => (
                    <option key={index} value={user}>
                        {user}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default UserSelect;