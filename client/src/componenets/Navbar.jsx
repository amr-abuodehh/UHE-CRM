import React from 'react';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import { useAuth } from '../AuthContext'; // Import useAuth to access logout
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation

function BasicExample() {
    const { logout, user } = useAuth(); // Access the logout function
    const navigate = useNavigate(); // Initialize useNavigate

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <Navbar bg="dark" data-bs-theme="dark" expand="lg" className="bg-body-tertiary">
            <Container>
                <Navbar.Brand href="/Homepage">UHE-CRM</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link href="/Homepage">Homepage</Nav.Link>
                        <NavDropdown title="Tasks" id="basic-nav-dropdown">
                            <NavDropdown.Item href="/Tasks">View Tasks</NavDropdown.Item>
                            {(user?.privilege === 'admin' || user?.privilege === 'manager') && (
                                <NavDropdown.Item href="/create_task">Create New Task</NavDropdown.Item>
                            )}
                        </NavDropdown>
                        <NavDropdown title="Suppliers" id="basic-nav-dropdown">
                            <NavDropdown.Item href="/Suppliers">View Suppliers</NavDropdown.Item>
                            <NavDropdown.Item href="/orders">View Orders</NavDropdown.Item>
                            <NavDropdown.Item href="/Create_supplier">Create New Supplier</NavDropdown.Item>

                        </NavDropdown>
                        <NavDropdown title="Clients" id="basic-nav-dropdown">
                            <NavDropdown.Item href="/clients">View Clients</NavDropdown.Item>
                            <NavDropdown.Item href="/quotations">View Quotations</NavDropdown.Item>
                            <NavDropdown.Item href="/create_clients">Create New Client</NavDropdown.Item>
                        </NavDropdown>

                        <NavDropdown title="HR" id="basic-nav-dropdown">
                            <NavDropdown.Item href="/exit_forms">Exit Forms</NavDropdown.Item>
                            <NavDropdown.Item href="/leave_forms">Leave Forms</NavDropdown.Item>
                            <NavDropdown.Item href="/create_exit_form">Create Exit Form</NavDropdown.Item>
                            <NavDropdown.Item href="/create_leave_form">Create Leave Form</NavDropdown.Item>
                        </NavDropdown>
                    </Nav>
                    <Nav>
                        <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default BasicExample;
