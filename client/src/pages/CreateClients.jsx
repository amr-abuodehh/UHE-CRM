
import React from "react"
import styles from '../styles/forms.module.css'
import { useState, useEffect } from "react"
import { useAuth } from "../AuthContext"
import { useNavigate } from "react-router-dom"
import { toast } from 'react-toastify';
import { createClientFormConfig } from '../config/formconfig'
import Form from "../componenets/Form"


export default function CreateClients({ selectedClient, setUpdateMode }) {
    const navigate = useNavigate();
    const { accessToken, user } = useAuth();
    const [formData, setFormData] = useState({
        name: "",
        company: "",
        website: "",
        email: "",
        phone: "",
        location: "",

    });

    const handleInput = (name, value) => {

        setFormData({ ...formData, [name]: value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let endpoint = '/api/clients/create';
            let method = 'POST';
            if (selectedClient) {
                endpoint = `/api/clients/update/${selectedClient.id}`;
                method = "PUT";
            }

            const response = await fetch(endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                    'username': user.username
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            toast.success(data.message)

            navigate('/clients');
            if (selectedClient) {
                setUpdateMode(false);
            }

            setFormData({
                name: "",
                company: "",
                website: "",
                email: "",
                phone: "",
                location: "",
            });
        } catch (error) {
            console.error('Error', error);
        }
    };
    useEffect(() => {
        if (selectedClient) {
            setFormData({
                name: selectedClient.name || "",
                company: selectedClient.company || "",
                website: selectedClient.website || "",
                email: selectedClient.email || "",
                phone: selectedClient.phone || "",
                location: selectedClient.location || "",

            });
        }
    }, [selectedClient]);


    return (
        <div className={styles.formBackground}>
            <div className={`container-fluid ${styles.customContainer}`}>
                <h2>{selectedClient ? "Update Client " : "Create New Client"}</h2>
                <Form
                    config={createClientFormConfig}
                    formData={formData}
                    handleInput={handleInput}
                />
                <button type="submit" className="btn btn-primary" onClick={handleSubmit}>Submit</button>
            </div>
        </div>
    )
}