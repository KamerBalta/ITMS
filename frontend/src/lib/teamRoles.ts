// Bunlar sadece bilgi amacli takim ici unvanlar -- sistem yetkisini (ProjectRole) etkilemez.
// Proje yetkilendirmesi ayrica ProjectMembers.ProjectRole (PM/Developer/QA/Tester) uzerinden yonetilir.
export const TEAM_ROLE_OPTIONS = [
    'Team Lead',
    'Backend Developer',
    'Frontend Developer',
    'Full-stack Developer',
    'QA Lead',
    'QA Engineer',
    'DevOps Engineer',
    'UI/UX Designer',
    'Business Analyst',
] as const;