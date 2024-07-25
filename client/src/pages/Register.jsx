import React, { useState } from 'react';
import styles from '../styles/forms.module.css';
import { useAuth } from '../AuthContext';
import { registerFormConfig } from '../config/formconfig';
import Form from '../componenets/Form';


export const Register = () => {
    const [formData, setFormData] = useState({ username: "", email: "", password: "", privilege: "user" });
    const { accessToken } = useAuth();

    const handleInput = (name, value) => {

        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch("/api/users/register", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`

                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            console.log("Registration Successful", response.data);

        } catch (error) {
            console.error("Registration Error:", error);

        }
        setFormData({ username: "", email: "", password: "", privilege: "" })
    };

    return (
        <div className={styles.formBackground}>
            <div className={`container-fluid ${styles.customContainer}`}>
                <h2>Register New User</h2>
                <Form
                    config={registerFormConfig}
                    formData={formData}
                    handleInput={handleInput}
                />
                <button type="submit" className="btn btn-primary" onClick={handleSubmit}>Submit</button>
            </div>
        </div>
    );
};
