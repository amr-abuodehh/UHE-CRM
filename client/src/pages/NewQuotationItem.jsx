import React, { useState } from 'react'
import styles from '../styles/forms.module.css'
import { newItemFormConfig } from '../config/formconfig.js'
import { useAuth } from '../AuthContext.js'
import Form from '../componenets/Form.jsx'
import { toast } from 'react-toastify'


export default function NewQuotationItem({ setNewItemMode, selectedQuotation }) {
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
            const response = await fetch(`/api/quotations/newitem`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ ...formData, quotationId: selectedQuotation })
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
                    config={newItemFormConfig}
                    formData={formData}
                    handleInput={handleInput}
                />
                <button type="submit" className="btn btn-primary" onClick={handleSubmit}>Submit</button>
            </div>
        </div>
    )
}