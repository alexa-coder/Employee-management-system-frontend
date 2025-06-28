import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Form, Row, Col, Pagination, Spinner, Dropdown, Modal } from 'react-bootstrap';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { debounce } from 'lodash';
import '../App.css';
import { toast } from 'react-toastify';
import api from '../api';

const EmployeeList = ({ token }) => {
    const [employees, setEmployees] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchFilter, setSearchFilter] = useState('all');
    const itemsPerPage = 5;
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState(null);

    // Debounced search function
    const debouncedSearch = useCallback(
        debounce((searchValue) => {
            fetchEmployees(searchValue);
        }, 500),
        [token, searchFilter]
    );

    // Fetch employees with search
    const fetchEmployees = async (search = '') => {
        try {
            setLoading(true);
            const response = await api.get(`employees/`, {
                headers: { Authorization: `Token ${token}` },
                params: {
                    search,
                    search_filter: searchFilter,
                    expand: 'department,designation'
                }
            });
            console.log('API Response:', response.data);

            setEmployees(response.data || []);
            setTotalPages(Math.ceil(response.data.length / itemsPerPage));
            setError(null);
        } catch (err) {
            console.error(err);
            setError("Failed to load employees");
            setEmployees([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch suggestions for autocomplete
    const fetchSuggestions = async (search) => {
        if (search.length > 2) {
            try {
                const response = await api.get(`employees/suggestions/`, {
                    headers: { Authorization: `Token ${token}` },
                    params: { search }
                });
                setSuggestions(response.data || []);
            } catch (err) {
                console.error('Failed to fetch suggestions', err);
            }
        }
    };

    // Handle search input change
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        setCurrentPage(1);
        debouncedSearch(value);
        fetchSuggestions(value);
    };

    // Select suggestion from dropdown
    const selectSuggestion = (suggestion) => {
        setSearchTerm(suggestion);
        setShowSuggestions(false);
        fetchEmployees(suggestion);
    };

    // Clear search
    const clearSearch = () => {
        setSearchTerm('');
        setCurrentPage(1);
        fetchEmployees('');
    };

    // Initialize component
    useEffect(() => {
        fetchEmployees();
        return () => debouncedSearch.cancel();
    }, [token]);

    const handleDelete = async (id) => {
        try {
            await api.delete(`employees/${id}/`, {
                headers: { Authorization: `Token ${token}` }
            });
            toast.success('Employee deleted successfully!');
            // Refresh employee list
            const response = await api.get('employees/', {
                headers: { Authorization: `Token ${token}` }
            });
            setEmployees(response.data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete employee');
        } finally {
            setShowDeleteModal(false);
        }
    };

    return (
        <div className="mt-4 employee-list-container">
            <h2 className="mb-4 d-flex justify-content-center" style={{ color: 'white', padding: '10px', background: '#002e79' }}>
                Employee Details
            </h2>
            {/* Search Section */}
            <div className="search-section mb-4 p-3 bg-light rounded">
                <Row className="align-items-center">
                    <Col md={4}>
                        <Form.Group className="position-relative">
                            <Form.Control
                                type="text"
                                placeholder={`Search by ${searchFilter === 'all' ? 'name, email, department...' : searchFilter}`}
                                value={searchTerm}
                                onChange={handleSearchChange}
                                onFocus={() => setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            />
                            {showSuggestions && suggestions.length > 0 && (
                                <div className="suggestions-dropdown">
                                    {suggestions.map((suggestion, index) => (
                                        <div
                                            key={index}
                                            className="suggestion-item"
                                            onMouseDown={() => selectSuggestion(suggestion)}
                                        >
                                            {suggestion}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Form.Group>
                    </Col>
                    <Col md={2}>
                        <Form.Select
                            value={searchFilter}
                            onChange={(e) => {
                                setSearchFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="all">All Fields</option>
                            <option value="name">Name</option>
                            <option value="email">Email</option>
                            <option value="department">Department</option>
                            <option value="designation">Designation</option>
                        </Form.Select>
                    </Col>
                    <Col md={2}>
                        <Button
                            variant="outline-secondary"
                            onClick={clearSearch}
                            disabled={!searchTerm}
                        >
                            Clear
                        </Button>
                    </Col>
                    <Col md={4} className="text-end">
                        <Button as={Link} to="/employees/add" className="btn-custom-blue">
                            <i className="bi bi-plus-circle"></i> Add Employee
                        </Button>
                    </Col>
                </Row>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="text-center my-5">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                    <p className="mt-2">Loading employees...</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="alert alert-danger mt-4">
                    {error}
                </div>
            )}

            {/* Results */}
            {!loading && !error && (
                <>
                    {employees.length === 0 ? (
                        <div className="alert alert-info">
                            {searchTerm ? (
                                `No employees found matching "${searchTerm}". Try a different search.`
                            ) : (
                                'No employees found. Add a new employee to get started.'
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <Table striped bordered hover className="employee-table">
                                    <thead className="table-dark">
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Department</th>
                                            <th>Designation</th>
                                            <th>Join Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {employees
                                            .slice(
                                                (currentPage - 1) * itemsPerPage,
                                                currentPage * itemsPerPage
                                            )
                                            .map((employee) => (
                                                <tr key={employee.id}>
                                                    <td>{employee.name}</td>
                                                    <td>{employee.email}</td>
                                                    <td>
                                                        {employee.department
                                                            ? (typeof employee.department === 'object'
                                                                ? employee.department.name
                                                                : 'ID: ' + employee.department)
                                                            : '-'}
                                                    </td>
                                                    <td>
                                                        {employee.designation
                                                            ? (typeof employee.designation === 'object'
                                                                ? employee.designation.title
                                                                : 'ID: ' + employee.designation)
                                                            : '-'}
                                                    </td>
                                                    <td>
                                                        {employee.join_date
                                                            ? new Date(employee.join_date).toLocaleDateString()
                                                            : '-'}
                                                    </td>
                                                    <td>
                                                        <Button
                                                            as={Link}
                                                            to={`/employees/edit/${employee.id}`}
                                                            variant="outline-primary"
                                                            size="sm"
                                                            className="me-2"
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={() => {
                                                                setEmployeeToDelete(employee.id);
                                                                setShowDeleteModal(true);
                                                            }}
                                                        >
                                                            Delete
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            <div className="d-flex justify-content-center mt-4">
                                <Pagination>
                                    <Pagination.First
                                        onClick={() => setCurrentPage(1)}
                                        disabled={currentPage === 1}
                                    />
                                    <Pagination.Prev
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                    />

                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }

                                        return (
                                            <Pagination.Item
                                                key={pageNum}
                                                active={pageNum === currentPage}
                                                onClick={() => setCurrentPage(pageNum)}
                                            >
                                                {pageNum}
                                            </Pagination.Item>
                                        );
                                    })}

                                    <Pagination.Next
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                    />
                                    <Pagination.Last
                                        onClick={() => setCurrentPage(totalPages)}
                                        disabled={currentPage === totalPages}
                                    />
                                </Pagination>
                            </div>

                            <div className="text-muted text-center mt-2">
                                Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
                                {Math.min(currentPage * itemsPerPage, employees.length)} of{' '}
                                {employees.length} employees
                            </div>
                        </>
                    )}
                </>
            )}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Delete</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to delete this employee? This action cannot be undone.
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        onClick={() => handleDelete(employeeToDelete)}
                    >
                        Delete
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default EmployeeList;