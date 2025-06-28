import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api';

const EmployeeForm = ({ token }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [employee, setEmployee] = useState({
        name: '',
        email: '',
        department: '',
        designation: '',
        join_date: ''
    });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const deptResponse = await api.get(`departments/`, {
                    headers: { Authorization: `Token ${token}` }
                });
                setDepartments(deptResponse.data || []);

                const desgResponse = await api.get(`designations/`, {
                    headers: { Authorization: `Token ${token}` }
                });
                setDesignations(desgResponse.data || []);

                if (id) {
                    const empResponse = await api.get(`employees/${id}/`, {
                        headers: { Authorization: `Token ${token}` }
                    });
                    setEmployee({
                        ...empResponse.data,
                        department: empResponse.data.department ?? '',
                        designation: empResponse.data.designation ?? '',
                        join_date: empResponse.data.join_date?.split('T')[0] || ''
                    });
                }
            } catch (err) {
                console.error('Error fetching data:', err);
                toast.error('Failed to load form data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token, id]);

    const validateEmail = (email) => email.endsWith('@bashyamgroup.com');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEmployee(prev => ({
            ...prev,
            [name]: (name === 'department' || name === 'designation')
                ? parseInt(value) || ''
                : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateEmail(employee.email)) {
            toast.error('Email address must end with @bashyamgroup.com');
            return;
        }

        try {
            setSubmitting(true);
            const employeeData = {
                name: employee.name,
                email: employee.email,
                join_date: employee.join_date,
                department: employee.department || null,
                designation: employee.designation || null
            };

            if (id) {
                await api.put(`employees/${id}/`, employeeData, {
                    headers: { Authorization: `Token ${token}` }
                });
                toast.success('Employee updated successfully!');
            } else {
                await api.post(`employees/`, employeeData, {
                    headers: { Authorization: `Token ${token}` }
                });
                toast.success('Employee added successfully!');
            }
            setTimeout(() => navigate('/employees'), 1000);
        } catch (err) {
            console.error(err);
            if (err.response?.data) {
                Object.entries(err.response.data).forEach(([field, errors]) => {
                    if (Array.isArray(errors)) {
                        errors.forEach(error => toast.error(`${field}: ${error}`));
                    } else {
                        toast.error(errors);
                    }
                });
            } else {
                toast.error('An error occurred while saving employee');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Container className="mt-5 text-center">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </Container>
        );
    }

    return (
        <Container className="mt-4 mb-5" style={{ maxWidth: '600px' }}>
            <h2>{id ? 'Edit' : 'Add'} Employee</h2>
            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                        type="text"
                        name="name"
                        value={employee.name}
                        onChange={handleChange}
                        required
                    />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                        type="email"
                        name="email"
                        value={employee.email}
                        onChange={handleChange}
                        required
                        onBlur={() => {
                            if (employee.email && !validateEmail(employee.email)) {
                                toast.warning('Email must end with @bashyamgroup.com');
                            }
                        }}
                    />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Department</Form.Label>
                    <Form.Select
                        name="department"
                        value={employee.department}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select Department</option>
                        {departments.map(dept => (
                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                    </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Designation</Form.Label>
                    <Form.Select
                        name="designation"
                        value={employee.designation}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select Designation</option>
                        {designations.map(desg => (
                            <option key={desg.id} value={desg.id}>{desg.title}</option>
                        ))}
                    </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Join Date</Form.Label>
                    <Form.Control
                        type="date"
                        name="join_date"
                        value={employee.join_date}
                        onChange={handleChange}
                        required
                    />
                </Form.Group>

                <Button variant="primary" type="submit" disabled={submitting}>
                    {submitting ? (
                        <>
                            <Spinner as="span" size="sm" animation="border" role="status" />{' '}
                            {id ? 'Updating...' : 'Saving...'}
                        </>
                    ) : (
                        id ? 'Update' : 'Save'
                    )}
                </Button>
            </Form>
        </Container>
    );
};
export default EmployeeForm;