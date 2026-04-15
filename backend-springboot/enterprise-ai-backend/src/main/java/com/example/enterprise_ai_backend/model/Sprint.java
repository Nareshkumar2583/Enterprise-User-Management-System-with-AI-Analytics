package com.example.enterprise_ai_backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "sprints")
public class Sprint {

    @Id
    private String id;

    private String name;
    private String goal;
    private String startDate;
    private String endDate;
    private String status; // PLANNING | ACTIVE | COMPLETED

    private List<String> taskIds = new ArrayList<>();
    private List<String> teamMemberIds = new ArrayList<>();

    private int velocityTarget = 20; // story points target
    private String createdBy;
    private String createdAt;

    // retrospective
    private String retrospectiveNote;

    public Sprint() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getGoal() { return goal; }
    public void setGoal(String goal) { this.goal = goal; }

    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }

    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public List<String> getTaskIds() { return taskIds; }
    public void setTaskIds(List<String> taskIds) { this.taskIds = taskIds; }

    public List<String> getTeamMemberIds() { return teamMemberIds; }
    public void setTeamMemberIds(List<String> teamMemberIds) { this.teamMemberIds = teamMemberIds; }

    public int getVelocityTarget() { return velocityTarget; }
    public void setVelocityTarget(int velocityTarget) { this.velocityTarget = velocityTarget; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getRetrospectiveNote() { return retrospectiveNote; }
    public void setRetrospectiveNote(String retrospectiveNote) { this.retrospectiveNote = retrospectiveNote; }
}
