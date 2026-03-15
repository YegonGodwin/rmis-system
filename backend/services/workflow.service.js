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

      // Notify admin to assign a radiologist; also broadcast to radiologists as fallback
      if (newStatus === 'Completed') {
        emitToRole('Admin', 'NOTIFICATION', {
          title: 'Study Ready for Assignment',
          message: `${study.modality} for ${study.patient.fullName} is complete and needs a radiologist assigned.`,
          type: 'info',
          studyId: String(study._id),
        });

        // Also notify radiologists so they can self-assign if no admin is online
        emitToRole('Radiologist', 'STUDY_AVAILABLE', {
          title: 'New Study Available',
          message: `${study.modality} for ${study.patient.fullName} is ready — awaiting assignment.`,
          type: 'info',
          studyId: String(study._id),
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
