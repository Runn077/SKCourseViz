export type ClusterMode = "connectivity" | "college" | "department" | "subject";

export type CourseNode = {
    id: string;
    label: string;
    college: string;
    department: string;
    subject_code: string;
};