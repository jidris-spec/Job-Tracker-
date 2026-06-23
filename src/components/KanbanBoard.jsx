// src/components/KanbanBoard.jsx
import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const COLUMNS = ["Applied", "Interviewing", "Offer", "Rejected"];
const COLORS = {
  Applied: "#3b82f6",
  Interviewing: "#f59e0b",
  Offer: "#22c55e",
  Rejected: "#ef4444",
};

function KanbanBoard({ jobs, onUpdate }) {

  const onDragEnd = (result) => {


    if (!result.destination) return;

    const jobId = result.draggableId;
    const newStatus = result.destination.droppableId;

    onUpdate(jobId, { status: newStatus });
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div style={{
        display: "flex",
        gap: "16px",
        overflowX: "auto",
        padding: "16px 0",
      }}>

        {COLUMNS.map((status) => {
          const columnJobs = jobs.filter((j) => j.status === status);

          return (
            <div key={status} style={{
              minWidth: "220px",
              flex: 1,
            }}>

              {/* Column header */}
              <div style={{
                borderTop: `3px solid ${COLORS[status]}`,
                padding: "12px",
                marginBottom: "8px",
                background: "var(--card-bg)",
                borderRadius: "var(--radius)",
              }}>
                <span style={{ fontWeight: 600, color: COLORS[status] }}>
                  {status}
                </span>
                <span style={{
                  marginLeft: "8px",
                  fontSize: "12px",
                  color: "var(--muted)",
                }}>
                  {columnJobs.length}
                </span>
              </div>

              {/* Droppable column */}
              <Droppable droppableId={status}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      minHeight: "200px",
                      padding: "4px",
                    }}
                  >

                    {/* Draggable cards */}
                    {columnJobs.map((job, index) => (
                      <Draggable
                        key={job.id}
                        draggableId={job.id}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              background: "var(--card-bg)",
                              border: "1px solid var(--card-border)",
                              borderRadius: "var(--radius)",
                              padding: "12px",
                              marginBottom: "8px",
                              cursor: "grab",
                              ...provided.draggableProps.style,
                            }}
                          >
                            <p style={{
                              fontWeight: 600,
                              margin: "0 0 4px",
                              color: "var(--fg)",
                            }}>
                              {job.company}
                            </p>
                            <p style={{
                              fontSize: "13px",
                              margin: "0",
                              color: "var(--muted)",
                            }}>
                              {job.title}
                            </p>
                            <p style={{
                              fontSize: "12px",
                              margin: "8px 0 0",
                              color: "var(--faint)",
                            }}>
                              {job.date}
                            </p>
                          </div>
                        )}
                      </Draggable>
                    ))}

                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}

      </div>
    </DragDropContext>
  );
}

export default KanbanBoard;

