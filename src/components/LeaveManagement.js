import React, { useState, useEffect } from 'react';
import { Table, Button, Form, Row, Col, Modal, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import api from '../api';

const LeaveManagement = ({ token }) => {
    const [leaveData, setLeaveData] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [year, setYear] = useState(new Date().getFullYear());
    const [showModal, setShowModal] = useState(false);
    const [error] = useState(null);
    const [newLeave, setNewLeave] = useState({
        employee: '',
        leave_type: 'CL',
        month: 1,
        year: new Date().getFullYear(),
        days_taken: 0.5
    });
    const [loading, setLoading] = useState(false);

    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                setLoading(true);
                const response = await api.get(`employees/`, {
                    headers: { Authorization: `Token ${token}` }
                });
                const employeesData = Array.isArray(response.data) ? response.data : [];
                setEmployees(employeesData);
                if (employeesData.length > 0) {
                    setSelectedEmployee(employeesData[0].id);
                    setNewLeave(prev => ({
                        ...prev,
                        employee: employeesData[0].id
                    }));
                }
            } catch (err) {
                console.error(err);
                toast.error('Failed to load employees');
            } finally {
                setLoading(false);
            }
        };
        fetchEmployees();
    }, [token]);

    useEffect(() => {
        const fetchLeaveData = async () => {
            if (selectedEmployee) {
                try {
                    setLoading(true);
                    const response = await api.get(`leaves/`, {
                        headers: { Authorization: `Token ${token}` },
                        params: { employee_id: selectedEmployee, year }
                    });
                    setLeaveData(Array.isArray(response.data) ? response.data : []);
                } catch (err) {
                    console.error(err);
                    toast.error('Failed to load leave data');
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchLeaveData();
    }, [token, selectedEmployee, year]);

    const handleSubmitLeave = async () => {
        try {
            setLoading(true);
            const leaveData = {
                employee: selectedEmployee,
                leave_type: newLeave.leave_type,
                month: newLeave.month,
                year: newLeave.year,
                days_taken: newLeave.days_taken
            };

            await api.post(`leaves/`, leaveData, {
                headers: { Authorization: `Token ${token}` }
            });

            toast.success('Leave application submitted successfully!');
            setShowModal(false);

            // Refresh leave data for current employee
            const response = await api.get(`leaves/`, {
                headers: { Authorization: `Token ${token}` },
                params: { employee_id: selectedEmployee, year }
            });
            setLeaveData(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to submit leave');
        } finally {
            setLoading(false);
        }
    };

    const calculateTotals = () => {
        const slTotal = leaveData
            .filter(leave => leave.leave_type === 'SL')
            .reduce((sum, leave) => sum + parseFloat(leave.days_taken), 0);

        const clTotal = leaveData
            .filter(leave => leave.leave_type === 'CL')
            .reduce((sum, leave) => sum + parseFloat(leave.days_taken), 0);

        return { slTotal, clTotal };
    };

    const { slTotal, clTotal } = calculateTotals();

    if (loading && employees.length === 0) {
        return (
            <div className="text-center mt-5">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-danger mt-4">
                {error}
            </div>
        );
    }

    return (
        <div className="mt-4 mb-5">
            <h2 className="mb-4 d-flex justify-content-center mt-5" style={{ color: 'white', padding: '10px', background: '#002e79' }}>
                Leave Management
            </h2>
            <Row className="mb-3">
                <Col md={4}>
                    <Form.Select
                        value={selectedEmployee}
                        onChange={(e) => {
                            const empId = parseInt(e.target.value);
                            setSelectedEmployee(empId);
                            setNewLeave(prev => ({
                                ...prev,
                                employee: empId
                            }));
                        }}
                        disabled={employees.length === 0}
                    >
                        {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>
                                {emp.name}
                            </option>
                        ))}
                    </Form.Select>
                </Col>
                <Col md={4}>
                    <Form.Control
                        type="number"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        placeholder="Year"
                    />
                </Col>
                <Col md={4}>
                    <Button
                        onClick={() => setShowModal(true)}
                        disabled={!selectedEmployee || employees.length === 0}
                        className="btn-custom-blue"
                    >
                        Apply for Leave
                    </Button>
                </Col>
            </Row>
            <h4 className="mb-3" style={{ color: 'white', padding: '6px', background: '#002e79' }}>
                Monthly Leave Details
            </h4>
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Month</th>
                        <th>SL Taken</th>
                        <th>CL Taken</th>
                    </tr>
                </thead>
                <tbody>
                    {months.map((month, index) => {
                        const monthNumber = index + 1;
                        const slDays = leaveData.find(
                            leave => leave.leave_type === 'SL' && leave.month === monthNumber
                        )?.days_taken || 0;
                        const clDays = leaveData.find(
                            leave => leave.leave_type === 'CL' && leave.month === monthNumber
                        )?.days_taken || 0;

                        return (
                            <tr key={month}>
                                <td>{month}</td>
                                <td>{slDays}</td>
                                <td>{clDays}</td>
                            </tr>
                        );
                    })}
                    <tr>
                        <td style={{ backgroundColor: '#84b5c7' }}><strong>Total</strong></td>
                        <td style={{ backgroundColor: '#84b5c7' }}><strong>{slTotal}</strong></td>
                        <td style={{ backgroundColor: '#84b5c7' }}><strong>{clTotal}</strong></td>
                    </tr>
                    <tr>
                        <td><strong>Actual Leave</strong></td>
                        <td><strong>16</strong></td>
                        <td><strong>12</strong></td>
                    </tr>
                    <tr>
                        <td style={{ backgroundColor: '#84b5c7' }}><strong>Balance</strong></td>
                        <td style={{ backgroundColor: '#84b5c7' }}><strong>{16 - slTotal}</strong></td>
                        <td style={{ backgroundColor: '#84b5c7' }}><strong>{12 - clTotal}</strong></td>
                    </tr>
                </tbody>
            </Table>
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Apply for Leave</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Employee</Form.Label>
                            <Form.Control
                                type="text"
                                value={employees.find(e => e.id === parseInt(selectedEmployee))?.name || ''}
                                readOnly
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Leave Type</Form.Label>
                            <Form.Select
                                value={newLeave.leave_type}
                                onChange={(e) => setNewLeave(prev => ({ ...prev, leave_type: e.target.value }))}
                            >
                                <option value="CL">Casual Leave</option>
                                <option value="SL">Sick Leave</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Month</Form.Label>
                            <Form.Select
                                value={newLeave.month}
                                onChange={(e) => setNewLeave(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                            >
                                {months.map((month, index) => (
                                    <option key={month} value={index + 1}>
                                        {month}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Year</Form.Label>
                            <Form.Control
                                type="number"
                                value={newLeave.year}
                                onChange={(e) => setNewLeave(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Days Taken</Form.Label>
                            <Form.Control
                                type="number"
                                step="0.5"
                                min="0.5"
                                max="12"
                                value={newLeave.days_taken}
                                onChange={(e) => setNewLeave(prev => ({ ...prev, days_taken: parseFloat(e.target.value) }))}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Close
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmitLeave}
                        disabled={loading}
                    >
                        {loading ? 'Submitting...' : 'Submit Leave'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default LeaveManagement;