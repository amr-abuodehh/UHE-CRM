import styles from '../styles/forms.module.css';
import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { loginFormConfig } from '../config/formconfig'
import Form from '../componenets/Form';




export default function Login() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ username: "", password: "" });
    const { login } = useAuth();

    const handleInput = (name, value) => {

        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(formData)
        }

        catch (error) {
            console.error("Login error:", error);
        }
        navigate('/Register')

    };

    return (
        <div className={styles.formBackground}>
            <div className={`container-fluid ${styles.customContainer}`}>
                <h2>Login</h2>
                <Form
                    config={loginFormConfig}
                    formData={formData}
                    handleInput={handleInput}
                />
                <button type="submit" className="btn btn-primary" onClick={handleSubmit}>Submit</button>
            </div>
        </div>
    );
}
