import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTable, usePagination } from 'react-table';
import { orderItemColumns } from '../config/orderitemcolumns';
import { useAuth } from '../AuthContext';
import { Popuptable } from '../componenets/Popuptable'


export default function OrderReceipt({ selectedOrder, setShowReceipt }) {
    const { accessToken } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const handleClose = () => setShowReceipt(false);

    const fetchItems = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/orders/fetch_items/${selectedOrder}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            setItems(data);
        } catch (error) {
            console.error('Error fetching items:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedOrder, accessToken]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const columns = useMemo(() => [...orderItemColumns], []);

    const tableInstance = useTable({ columns, data: items }, usePagination);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <Popuptable handleClose={handleClose} tableInstance={tableInstance} />
    );
}
