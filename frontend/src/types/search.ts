export interface SearchResults {
    tasks: { id: string; title: string; projectName: string; status: string }[];
    projects: { id: string; name: string; key: string }[];
    users: { id: string; name: string; email: string }[];
}