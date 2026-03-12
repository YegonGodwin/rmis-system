import Study from '../models/study.js';
import ImagingRequest from '../models/imagingRequest.js';
import RadiologyReport from '../models/radiologyReport.js';
import { emitToRole, emitToUser } from '../utils/socket.js';

export const WorkflowOrchestrator = {
  /**
   * Automates transitions when a study's status is updated.
   */
  async onStudyStatusChange(studyId, newStatus) {
    try {
      const study = await Study.findById(studyId).populate('imagingRequest').populate('patient');
      if (!study) return;

      const imagingRequest = study.imagingRequest;

      // Notify Radiologist if study is completed
      if (newStatus === 'Completed') {
        emitToRole('Radiologist', 'NOTIFICATION', {
          title: 'Study Completed',
          message: `New ${study.modality} for ${study.patient.fullName} is ready for reporting.`,
          type: 'info',
        });

        if (imagingRequest && imagingRequest.status !== 'Completed') {
          imagingRequest.status = 'Completed';
          await imagingRequest.save();
        }
      }

      // Notify Physician if study is scheduled/in-progress
      if (study.referringPhysician) {
        emitToUser(study.referringPhysician, 'NOTIFICATION', {
          title: 'Study Update',
          message: `Study for ${study.patient.fullName} is now ${newStatus}.`,
          type: 'info',
        });
      }

    } catch (err) {
      console.error('[Workflow] Error in onStudyStatusChange:', err);
    }
  },

  /**
   * Automates transitions when a report's status is updated.
   */
  async onReportStatusChange(reportId, newStatus) {
    try {
      const report = await RadiologyReport.findById(reportId).populate('study').populate('patient');
      if (!report || !report.study) return;

      const study = report.study;

      // Rule: If a report is finalized, notify physician
      if (newStatus === 'Final') {
          emitToUser(study.referringPhysician, 'NOTIFICATION', {
            title: 'Report Finalized',
            message: `The radiology report for ${report.patient.fullName} is now available.`,
            type: 'success',
            isCritical: report.isCritical
          });

          if (study.status !== 'Completed') {
              study.status = 'Completed';
              study.performedEndAt = study.performedEndAt || new Date();
              await study.save();
              await this.onStudyStatusChange(study._id, 'Completed');
          }
      }
    } catch (err) {
      console.error('[Workflow] Error in onReportStatusChange:', err);
    }
  }
};
