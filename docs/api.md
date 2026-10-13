# CIVICEYE AI — API Documentation

The CIVICEYE AI backend exposes RESTful endpoints with interactive Swagger UI docs available at `/docs` and ReDoc at `/redoc`.

## Authentication
| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new citizen account | Public |
| `POST` | `/api/auth/login` | Login and receive access + refresh JWT | Public |
| `POST` | `/api/auth/refresh` | Refresh expired access token | Public |
| `GET` | `/api/auth/me` | Fetch active user profile | Any Authenticated |
| `POST` | `/api/auth/logout` | Logout and record audit log | Any Authenticated |

## Civic Issues
| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `POST` | `/api/issues` | Report new civic issue with image upload | Citizen / Manager |
| `GET` | `/api/issues` | List issues with search, category, priority filters | Authenticated |
| `GET` | `/api/issues/{id}` | Get issue details, AI analyses & status history | Authenticated |
| `POST` | `/api/issues/{id}/verify` | Manager triage, verify category, priority & department | Manager / Admin |
| `POST` | `/api/issues/{id}/reopen` | Reopen unsatisfied resolved issue | Citizen / Manager |

## AI Vision Engine
| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `POST` | `/api/ai/analyze` | Run computer vision inference on photo | Authenticated |

## Work Orders & Dispatch
| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `POST` | `/api/work-orders` | Create work order and assign worker | Manager / Admin |
| `GET` | `/api/work-orders` | List work orders with status filter | Manager / Admin |
| `GET` | `/api/work-orders/{id}` | Get work order details | Manager / Admin |
| `PUT` | `/api/work-orders/{id}/status` | Advance status (`WORK_STARTED`, `WORK_COMPLETED`) | Manager / Admin |
| `POST` | `/api/work-orders/{id}/evidence`| Upload Before & After visual evidence | Manager / Admin |
| `POST` | `/api/work-orders/{id}/verify` | Verify completion and close issue | Manager / Admin |

## Municipal Staff
| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `GET` | `/api/staff` | Roster with department, performance & status | Manager / Admin |
| `POST` | `/api/staff` | Register new staff worker | Manager / Admin |
| `GET` | `/api/staff/{id}` | Staff profile & performance stats | Manager / Admin |
| `PUT` | `/api/staff/{id}` | Update staff details | Manager / Admin |
| `POST` | `/api/staff/{id}/admin-action`| File formal disciplinary or award action | Manager / Admin |

## Resignations
| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `POST` | `/api/resignations/staff/{id}` | Submit staff resignation request | Manager / Admin |
| `GET` | `/api/resignations` | List pending resignations | Manager / Admin |
| `PUT` | `/api/resignations/{id}/review` | Approve or reject resignation | Manager / Admin |

## Citizen Feedback
| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `POST` | `/api/feedback` | Submit 1-5 star review & verification | Citizen |
| `GET` | `/api/feedback` | List citizen reviews | Authenticated |

## Smart City Analytics & Reports
| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `GET` | `/api/analytics/dashboard` | Aggregated KPIs, trends, categories, satisfaction | Authenticated |
| `GET` | `/api/reports/issues/csv` | Download complete issues report in CSV | Manager / Admin |
| `GET` | `/api/reports/staff/csv` | Download staff performance report in CSV | Manager / Admin |
| `GET` | `/api/reports/feedback/csv`| Download citizen satisfaction report in CSV | Manager / Admin |
| `GET` | `/api/audit-logs` | Query system audit trail | Manager / Admin |
| `POST` | `/api/demo/reset` | 1-Click reset to clean 248 Expo demo issues | Public / Any |
