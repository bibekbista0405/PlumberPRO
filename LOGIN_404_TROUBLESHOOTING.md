# Fix: `/api/auth/register` or `/api/auth/login` returns 404

This project runs the React development server on port 3000 and Express on port 5000. The React app calls relative `/api` paths. The root `package.json` now proxies those requests to `http://localhost:5000`.

## Start both servers

**Terminal 1 — backend**

```powershell
cd backend
npm install
npm start
```

**Terminal 2 — frontend**

```powershell
npm install
npm start
```

Restart the frontend after changing `package.json` so Create React App loads the new proxy configuration.

## Check backend health

Open `http://localhost:5000/api/health`. A running API should return JSON similar to:

```json
{"ok":true,"service":"PlumbPro API","database":"mysql"}
```

If port 5000 is not reachable, start/fix the backend first. If the health route reports the database connection failure, check `backend/.env`, start MySQL/MariaDB in XAMPP, and verify DB_HOST, DB_PORT, DB_NAME, DB_USER, and DB_PASSWORD.

The React DevTools notice is informational. The `apple-mobile-web-app-capable` warning is a metadata deprecation notice; the standard `mobile-web-app-capable` tag has also been added. Neither causes the authentication 404.
