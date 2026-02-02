export interface Subject {
  id: string;
  subjectCode: string;
  subjectName: string;
  description?: string;
  createdBy?: string;
  isDeleted: boolean;
  createdDate?: string | Date;
  updatedDate?: string | Date;
}
