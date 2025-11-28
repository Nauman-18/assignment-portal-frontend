// src/pages/StudentDashboard.jsx
import React, { useEffect, useState } from "react";
import API from "../api";
import { useAuth } from "../context/AuthContext";

export default function StudentDashboard() {
  const { user, logout } = useAuth() || {};
  const studentId = user?._id || user?.id || localStorage.getItem("userId") || null;

  const [assignments, setAssignments] = useState([]);
  const [submissionsMap, setSubmissionsMap] = useState({}); // assignmentId -> submission
  const [loading, setLoading] = useState(false);

  // submission modal state
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [submissionContent, setSubmissionContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [viewingSubmission, setViewingSubmission] = useState(null);

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      // fetch published assignments (server default)
      const assignmentsRes = await API.get("/assignments");
      const list = Array.isArray(assignmentsRes.data) ? assignmentsRes.data : assignmentsRes.data.assignments || assignmentsRes.data;

      // fetch student's submissions (if logged in)
      let subs = [];
      if (studentId) {
        try {
          const subsRes = await API.get(`/submissions/student/${studentId}`);
          subs = Array.isArray(subsRes.data) ? subsRes.data : subsRes.data.submissions || subsRes.data;
        } catch (err) {
          console.warn("Could not fetch submissions for student:", err?.response?.data || err.message);
          subs = [];
        }
      }

      // build map: assignmentId -> latest submission
      const map = {};
      subs.forEach((s) => {
        const aid = s.assignment ? (s.assignment._id || s.assignment) : s.assignmentId || s.assignment;
        if (!aid) return;
        // keep the latest submission per assignment (by createdAt)
        if (!map[aid] || new Date(s.createdAt) > new Date(map[aid].createdAt)) {
          map[aid] = s;
        }
      });

      setAssignments(list);
      setSubmissionsMap(map);
    } catch (err) {
      console.error("Load assignments error:", err, err?.response?.data);
      setAssignments([]);
      setSubmissionsMap({});
    } finally {
      setLoading(false);
    }
  }

  function openSubmissionModal(assignment) {
    setCurrentAssignment(assignment);
    setSubmissionContent("");
    setViewingSubmission(null);
    setSubModalOpen(true);
  }

  function openViewSubmission(sub) {
    setViewingSubmission(sub);
    setSubModalOpen(true);
    setCurrentAssignment(null);
    setSubmissionContent("");
  }

  function closeSubmissionModal() {
    setSubModalOpen(false);
    setCurrentAssignment(null);
    setSubmissionContent("");
    setViewingSubmission(null);
  }

  async function handleSubmitAssignment(e) {
    e.preventDefault();
    if (!currentAssignment) return;
    if (!studentId && !localStorage.getItem("token")) {
      alert("You must be logged in to submit.");
      return;
    }

    // guard: don't allow duplicate if already submitted
    const assignmentId = currentAssignment._id || currentAssignment.id;
    const existing = submissionsMap[assignmentId];
    if (existing) {
      alert("You have already submitted this assignment.");
      closeSubmissionModal();
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        assignmentId,
        content: submissionContent || "",
      };
      await API.post("/submissions", payload);

      // refresh lists so UI shows Submitted
      await loadAll();
      alert("Submitted successfully");
      closeSubmissionModal();
    } catch (err) {
      console.error("Submit failed:", err, err?.response?.data);
      const msg = err?.response?.data?.message || err.message || "Submit failed";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>Student Dashboard</h2>
          <div style={{ color: "#666" }}>Welcome{user?.name ? `, ${user.name}` : ""}</div>
        </div>
        <div>
          <button
            onClick={() => {
              if (logout) logout();
              localStorage.removeItem("token");
              localStorage.removeItem("userId");
              window.location = "/login";
            }}
            style={{ padding: "8px 12px" }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {loading ? (
        <div>Loading assignments…</div>
      ) : assignments.length === 0 ? (
        <div style={{ padding: 20, background: "#fff", borderRadius: 8 }}>No published assignments yet.</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {assignments.map((a) => {
            const aid = a._id || a.id;
            const submission = submissionsMap[aid];
            const hasSubmitted = !!submission;
            const submittedDate = submission ? new Date(submission.createdAt) : null;

            return (
              <div
                key={aid}
                style={{
                  background: "#fff",
                  padding: 14,
                  borderRadius: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ maxWidth: "70%" }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{a.title}</div>
                  {a.description ? <div style={{ color: "#444", marginTop: 6 }}>{a.description}</div> : null}
                  <div style={{ color: "#666", marginTop: 6, fontSize: 13 }}>
                    {a.submittedCount || (a.submittedBy ? a.submittedBy.length : 0)} submitted
                    {a.dueDate ? ` • Due ${new Date(a.dueDate).toLocaleDateString()}` : null}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {hasSubmitted ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                      <div style={{ color: "#16a34a", fontWeight: 700 }}>Submitted ✓</div>
                      <div style={{ color: "#666", fontSize: 12 }}>{submittedDate ? submittedDate.toLocaleString() : ""}</div>
                      <div style={{ marginTop: 8 }}>
                        <button
                          onClick={() => openViewSubmission(submission)}
                          style={{ background: "transparent", border: "1px solid #e6e6e6", padding: "6px 10px", borderRadius: 6 }}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                      <div style={{ color: "#f59e0b", fontWeight: 700 }}></div>
                      <div style={{ marginTop: 8 }}>
                        <button
                          onClick={() => openSubmissionModal(a)}
                          style={{ background: "#2563EB", color: "#fff", padding: "8px 12px", borderRadius: 6 }}
                        >
                          Submit
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submission modal (create) or View submission */}
      {subModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 80 }}>
          <div style={{ width: 620, maxHeight: "85vh", overflowY: "auto", background: "#fff", padding: 18, borderRadius: 8 }}>
            {viewingSubmission ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0 }}>Submission Details</h3>
                  <button onClick={closeSubmissionModal} style={{ padding: "6px 10px" }}>
                    Close
                  </button>
                </div>

                <div style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 700 }}>{viewingSubmission.assignment?.title || "Submission"}</div>
                  <div style={{ color: "#666", marginTop: 8, fontSize: 13 }}>{viewingSubmission.content || "(no message)"}</div>
                  {viewingSubmission.fileUrl ? (
                    <div style={{ marginTop: 10 }}>
                      <a href={viewingSubmission.fileUrl} target="_blank" rel="noreferrer">
                        Download file
                      </a>
                    </div>
                  ) : null}
                  <div style={{ marginTop: 12, color: "#666", fontSize: 12 }}>
                    Submitted at: {viewingSubmission.createdAt ? new Date(viewingSubmission.createdAt).toLocaleString() : ""}
                  </div>
                </div>
              </>
            ) : currentAssignment ? (
              <form onSubmit={handleSubmitAssignment}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0 }}>Submit — {currentAssignment.title}</h3>
                  <button type="button" onClick={closeSubmissionModal} style={{ padding: "6px 10px" }}>
                    Cancel
                  </button>
                </div>

                <div style={{ marginTop: 12 }}>
                  <label style={{ display: "block", marginBottom: 8 }}>Message / Notes</label>
                  <textarea value={submissionContent} onChange={(e) => setSubmissionContent(e.target.value)} style={{ width: "100%", minHeight: 120, padding: 8 }} />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
                  <button type="button" onClick={closeSubmissionModal} style={{ padding: "8px 12px" }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} style={{ background: "#2563EB", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 6 }}>
                    {submitting ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <button onClick={closeSubmissionModal} style={{ padding: "6px 10px" }}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
