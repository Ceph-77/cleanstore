import { apiClient } from "./client";
import type { Task, TaskStep } from "../types";

export interface TaskInstructionsUpdate {
  expectedResultText?: string;
  howToText?: string;
  requiredEquipment?: string[];
  estimatedDurationMinutes?: number;
}

export function listMyStoreTasks() {
  return apiClient.get<{ tasks: Task[] }>("/task-instructions");
}

export function getTaskInstructions(taskId: string) {
  return apiClient.get<{ task: Task }>(`/task-instructions/${taskId}`);
}

export function updateTaskInstructions(taskId: string, data: TaskInstructionsUpdate) {
  return apiClient.patch<{ task: Task }>(`/task-instructions/${taskId}`, data);
}

export function uploadExpectedPhotos(taskId: string, files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append("photos", file));
  return apiClient.upload<{ task: Task }>(`/task-instructions/${taskId}/photos`, formData);
}

export function deleteExpectedPhoto(taskId: string, photoId: string) {
  return apiClient.delete<void>(`/task-instructions/${taskId}/photos/${photoId}`);
}

export function addStep(taskId: string, text: string) {
  return apiClient.post<{ step: TaskStep }>(`/task-instructions/${taskId}/steps`, { text });
}

export function updateStep(taskId: string, stepId: string, text: string) {
  return apiClient.patch<{ step: TaskStep }>(`/task-instructions/${taskId}/steps/${stepId}`, { text });
}

export function deleteStep(taskId: string, stepId: string) {
  return apiClient.delete<void>(`/task-instructions/${taskId}/steps/${stepId}`);
}
