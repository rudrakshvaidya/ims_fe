export default function Dashboard() {
  return (
    <div className="d-flex align-items-center justify-content-center vh-100 bg-body-tertiary">
      <main className="form-signin" style={{ width: "330px" }}>
        <div className="container">
          <div className="card p-4 shadow-sm">
            <h2 className="h3 mb-3 fw-normal text-center">Dashboard</h2>
            <p className="text-center">Welcome to the dashboard!</p>
            <p className="text-center">
              This is a placeholder for your dashboard content.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}