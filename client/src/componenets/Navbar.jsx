import React from 'react';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaTasks, FaUserTie, FaUsers, FaUser, FaHome, FaSignOutAlt } from 'react-icons/fa';
import uheLogo from '../assets/images/uhe_logo.png';
import styles from '../styles/navbar.module.css';

function BasicExample() {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <Navbar bg="dark" variant="dark" expand="lg">
            <Container>
                <Navbar.Brand href="/Homepage">
                    <img
                        src={uheLogo}
                        alt="UHE-CRM Logo"
                        style={{ width: '50px', height: 'auto' }}
                    />
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link href="/Homepage" className={styles.navLink}>
                            <FaHome className={styles.navIcon} /> Homepage
                        </Nav.Link>
                        <NavDropdown title={<><FaTasks className={styles.navIcon} /> Tasks</>} id="basic-nav-dropdown" className={styles.navLink}>
                            <NavDropdown.Item href="/Tasks">View Tasks</NavDropdown.Item>
                            {(user?.privilege === 'admin' || user?.privilege === 'manager') && (
                                <NavDropdown.Item href="/create_task">Create New Task</NavDropdown.Item>
                            )}
                        </NavDropdown>
                        {(user?.privilege === 'admin' || user?.privilege === 'manager' || user?.privilege === 'sales') && (
                            <NavDropdown title={<><FaUsers className={styles.navIcon} /> Suppliers</>} id="basic-nav-dropdown" className={styles.navLink}>
                                <NavDropdown.Item href="/Suppliers">View Suppliers</NavDropdown.Item>
                                <NavDropdown.Item href="/orders">View Orders</NavDropdown.Item>
                                <NavDropdown.Item href="/Create_supplier">Create New Supplier</NavDropdown.Item>
                            </NavDropdown>

                        )}
                        {(user?.privilege === 'admin' || user?.privilege === 'manager' || user?.privilege === 'sales') && (
                            <NavDropdown title={<><FaUser className={styles.navIcon} /> Clients</>} id="basic-nav-dropdown" className={styles.navLink}>
                                <NavDropdown.Item href="/clients">View Clients</NavDropdown.Item>
                                <NavDropdown.Item href="/quotations">View Quotations</NavDropdown.Item>
                                <NavDropdown.Item href="/create_clients">Create New Client</NavDropdown.Item>
                            </NavDropdown>)}

                        <NavDropdown title={<><FaUserTie className={styles.navIcon} /> HR</>} id="basic-nav-dropdown" >
                            <NavDropdown.Item href="/exit_forms">Exit Forms</NavDropdown.Item>
                            <NavDropdown.Item href="/leave_forms">Leave Forms</NavDropdown.Item>
                            <NavDropdown.Item href="/create_exit_form">Create Exit Form</NavDropdown.Item>
                            <NavDropdown.Item href="/create_leave_form">Create Leave Form</NavDropdown.Item>
                        </NavDropdown>
                    </Nav>
                    <Nav className={styles.navLogout}>
                        <Nav.Link onClick={handleLogout} >
                            <FaSignOutAlt /> Logout
                        </Nav.Link>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default BasicExample;
