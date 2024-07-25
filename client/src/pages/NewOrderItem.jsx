import React, { useState } from 'react'
import styles from '../styles/forms.module.css'
import { orderItemFormConfig } from '../config/formconfig.js'
import { useAuth } from '../AuthContext'
import Form from '../componenets/Form.jsx'
import { toast } from 'react-toastify'


export default function NewOrderItem({ setNewItemMode, selectedOrder }) {
    const { accessToken } = useAuth();
    const [formData, setFormData] = useState({
        item_name: '',
        item_description: '',
        price: '',
        quantity: '',

    });

    const handleInput = (name, value) => {

        setFormData({ ...formData, [name]: value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`/api/orders/newitem`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ ...formData, orderId: selectedOrder })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            toast.success(data.message);
            setNewItemMode(false); // Return to quotations page
        } catch (error) {
            console.error('Error adding new item:', error);
            toast.error('Failed to add new item');
        }
    };






    return (
        <div className={styles.formBackground}>
            <div className={`container-fluid ${styles.customContainer}`}>
                <h2>Add Item</h2>
                <Form
                    config={orderItemFormConfig}
                    formData={formData}
                    handleInput={handleInput}
                />
                <button type="submit" className="btn btn-primary" onClick={handleSubmit}>Submit</button>
            </div>
        </div>
    )
}