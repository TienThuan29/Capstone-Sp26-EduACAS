export interface Material {
  id: string;
  lecturerId: string;
  classroomId: string;
  filename: string;
  fileUrl: string;
  description: string;
  isDeleted: boolean;
  createdDate: string;
  lecturerName?: string;
  lecturerEmail?: string;
}

export interface PagedMaterials {
  items: Material[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
}

export interface CreateMaterialRequest {
  classroomId: string;
  lecturerId: string;
  description: string;
  file: File;
}

export interface UpdateMaterialRequest {
  description: string;
}
