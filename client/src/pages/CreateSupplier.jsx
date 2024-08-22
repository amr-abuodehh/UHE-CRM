import { useNavigate } from 'react-router-dom';
import styles from '../styles/forms.module.css';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { toast } from 'react-toastify';
import Form from '../componenets/Form';
import { createSupplierFormConfig } from '../config/formconfig'

export default function CreateSupplier({ selectedSupplier, setUpdateMode }) {
    const [formData, setFormData] = useState({
        name: "", email: "", phone: "", desc: "", location: "", company: "", website: ""
    });
    const { accessToken, user } = useAuth();
    const navigate = useNavigate();

    //Submit for both Create and Update

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let endpoint = '/api/suppliers/create';
            let method = 'POST';
            if (selectedSupplier) {
                endpoint = `/api/suppliers/update/${selectedSupplier.ref_number}`;
                method = "PUT";
            }

            const response = await fetch(endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                    'username': user.username
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            toast.success(data.message)

            navigate('/Suppliers');
            if (selectedSupplier) {
                setUpdateMode(false);
            }

            setFormData({ name: '', email: '', phone: '', desc: '', location: '' });
        } catch (error) {
            console.error('Error', error);
        }
    };

    //Setting Form Data

    const handleInput = (name, value) => {

        setFormData({ ...formData, [name]: value });
    };

    //USE EFFECT populate form With Existing Supplier info in Update mode

    useEffect(() => {
        if (selectedSupplier) {
            setFormData({
                name: selectedSupplier.name || "",
                company: selectedSupplier.company || "",
                website: selectedSupplier.website || "",
                email: selectedSupplier.email || "",
                phone: selectedSupplier.phone || "",
                desc: selectedSupplier.description || "",
                location: selectedSupplier.location || "",

            });
        }
    }, [selectedSupplier]);

    return (
        <div className={styles.formBackground}>
            <div className={`container-fluid ${styles.customContainer}`}>
                <h2>Create New Supplier</h2>
                <Form
                    config={createSupplierFormConfig}
                    formData={formData}
                    handleInput={handleInput}
                />



                <button type="submit" className="btn btn-primary" onClick={handleSubmit}>Submit</button>
            </div>
        </div>
    );
}
