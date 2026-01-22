import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDateTime } from '../../utils/dateHelpers';

const ProjectReport = ({ project, user, tasks }) => {

    const generatePDF = () => {
        const doc = new jsPDF();

        // 1. Header
        doc.setFontSize(22);
        doc.setTextColor(0, 150, 136); // Teal color
        doc.text("PBL PROJECT DOSSIER", 105, 20, null, null, "center");

        doc.setFontSize(16);
        doc.setTextColor(40, 40, 40);
        doc.text(project.title, 105, 30, null, null, "center");

        // 2. Student Info
        doc.setFontSize(12);
        doc.text(`Student: ${user.name} (${user.email})`, 14, 45);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 52);
        doc.text(`Mastery Level: ${user.level || 1} (${user.xp || 0} XP)`, 14, 59);

        // 3. Project Summary
        doc.setLineWidth(0.5);
        doc.line(14, 65, 196, 65);
        doc.setFontSize(14);
        doc.text("Mission Summary", 14, 75);
        doc.setFontSize(11);
        const splitDesc = doc.splitTextToSize(project.description || "No description provided.", 180);
        doc.text(splitDesc, 14, 85);

        // 4. Tasks & Evidence
        let yPos = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : 110;
        doc.setFontSize(14);
        doc.text("Task Execution Log", 14, yPos);

        const tableData = tasks.map(task => [
            task.title,
            task.status,
            task.priority,
            formatDateTime(task.updatedAt)
        ]);

        autoTable(doc, {
            startY: yPos + 5,
            head: [['Task Name', 'Status', 'Priority', 'Last Updated']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [0, 150, 136] }
        });

        // 5. GitHub Contributions (Mock-up based on Task Links)
        yPos = doc.lastAutoTable.finalY + 15;
        doc.setFontSize(14);
        doc.text("Code Contributions", 14, yPos);

        const linkedRepos = tasks
            .filter(t => t.githubRepo)
            .map(t => `${t.githubRepo.owner}/${t.githubRepo.repo} (${t.githubCommits?.length || 0} commits)`);

        const uniqueRepos = [...new Set(linkedRepos)];

        if (uniqueRepos.length > 0) {
            uniqueRepos.forEach((repo, i) => {
                doc.setFontSize(11);
                doc.text(`• ${repo}`, 20, yPos + 10 + (i * 7));
            });
        } else {
            doc.setFontSize(11);
            doc.setFont(undefined, 'italic');
            doc.text("No repositories linked.", 20, yPos + 10);
            doc.setFont(undefined, 'normal');
        }

        doc.save(`${user.name.replace(' ', '_')}_Project_Report.pdf`);
    };

    return (
        <button
            onClick={generatePDF}
            className="btn btn-primary flex items-center gap-2"
        >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Generate Project Report
        </button>
    );
};

export default ProjectReport;
