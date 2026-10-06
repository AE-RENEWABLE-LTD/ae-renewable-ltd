"use strict";

const fs = require("fs");
const path = require("path");
const installerService = require("../services/installer.service");
const notificationService = require("../services/notification.service");

function saveBase64Image(base64Str, prefix = "installer-photo") {
    if (!base64Str || typeof base64Str !== "string") return null;
    const matches = base64Str.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        return null;
    }
    const mimeType = matches[1].toLowerCase();
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowed.includes(mimeType)) {
        return null;
    }
    const ext = mimeType === "image/png" ? "png" : (mimeType === "image/webp" ? "webp" : "jpg");
    const buffer = Buffer.from(matches[2], "base64");
    if (buffer.length > 10 * 1024 * 1024) {
        throw new Error("Image exceeds 10MB limit.");
    }
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const filename = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;
    fs.writeFileSync(path.join(uploadsDir, filename), buffer);
    return `/uploads/${filename}`;
}

/* =========================================================
   AE RENEWABLE NETWORK
   INSTALLER CONTROLLER
========================================================= */

/* =========================================================
   GET CURRENT INSTALLER
========================================================= */

async function getMyInstaller(req, res, next) {
    try {
        const installer =
            await installerService.getInstallerByUserId(
                req.user.id
            );

        if (!installer) {
            return res.status(404).json({
                success: false,
                message: "Installer profile not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Installer profile retrieved successfully.",
            data: installer
        });

    } catch (error) {
        next(error);
    }
}

/* =========================================================
   UPDATE CURRENT INSTALLER
========================================================= */

async function updateMyInstaller(req, res, next) {
    try {
        const existingInstaller =
            await installerService.getInstallerByUserId(
                req.user.id
            );

        if (!existingInstaller) {
            return res.status(404).json({
                success: false,
                message: "Installer profile not found."
            });
        }

        const updateFields = {
            ...req.body
        };

        // 1. Guard protected fields: installer ID, email, phone cannot be changed directly
        const protectedKeys = {
            installer_code: existingInstaller.installer_code,
            installerCode: existingInstaller.installer_code,
            email: existingInstaller.email || existingInstaller.user_email,
            phone: existingInstaller.phone || existingInstaller.user_phone,
            phoneNumber: existingInstaller.phone || existingInstaller.user_phone,
            phone_number: existingInstaller.phone || existingInstaller.user_phone
        };

        for (const [key, currentVal] of Object.entries(protectedKeys)) {
            if (updateFields[key] !== undefined && updateFields[key] !== null) {
                const newVal = String(updateFields[key]).trim();
                const oldVal = String(currentVal || "").trim();
                if (newVal && oldVal && newVal !== oldVal) {
                    return res.status(403).json({
                        success: false,
                        message: `Protected field "${key}" cannot be edited directly. You must submit an Admin Change Request to modify your Installer ID, Email, or Phone number.`
                    });
                }
            }
            // Strip from update payload so it cannot be altered
            delete updateFields[key];
        }

        // 2. Check banking fields
        const isBankingUpdate =
            Object.prototype.hasOwnProperty.call(updateFields, "bankName") ||
            Object.prototype.hasOwnProperty.call(updateFields, "accountName") ||
            Object.prototype.hasOwnProperty.call(updateFields, "accountNumber") ||
            Object.prototype.hasOwnProperty.call(updateFields, "accountBvn") ||
            Object.prototype.hasOwnProperty.call(updateFields, "bank_name") ||
            Object.prototype.hasOwnProperty.call(updateFields, "account_name") ||
            Object.prototype.hasOwnProperty.call(updateFields, "account_number") ||
            Object.prototype.hasOwnProperty.call(updateFields, "account_bvn");

        if (isBankingUpdate) {
            if (existingInstaller.banking_verification_status === "verified") {
                return res.status(403).json({
                    success: false,
                    message: "Your banking settlement details have already been verified and locked. In compliance with financial security policy, they cannot be edited directly unless requested and unlocked by Admin."
                });
            }
            // Set to pending verification upon submission
            updateFields.bankingVerificationStatus = "pending";
        }

        // If profileImage or profile_image is base64, save to /uploads/ directory
        if (updateFields.profileImage && updateFields.profileImage.startsWith("data:image/")) {
            const savedUrl = saveBase64Image(updateFields.profileImage, `installer-${existingInstaller.installer_code || existingInstaller.id}`);
            if (savedUrl) updateFields.profileImage = savedUrl;
        } else if (updateFields.profile_image && updateFields.profile_image.startsWith("data:image/")) {
            const savedUrl = saveBase64Image(updateFields.profile_image, `installer-${existingInstaller.installer_code || existingInstaller.id}`);
            if (savedUrl) {
                updateFields.profileImage = savedUrl;
                delete updateFields.profile_image;
            }
        }

        const installer =
            await installerService.updateInstaller(
                existingInstaller.id,
                updateFields
            );

        if (!installer) {
            return res.status(404).json({
                success: false,
                message: "Installer profile not found."
            });
        }

        res.status(200).json({
            success: true,
            message: isBankingUpdate 
                ? "Account details and verification photo submitted successfully. Your card is now Pending Verification by Admin."
                : "Installer profile updated successfully.",
            data: installer
        });

    } catch (error) {
        next(error);
    }
}

/* =========================================================
   UPLOAD / CAPTURE INSTALLER PROFILE PHOTO
========================================================= */

async function uploadProfilePhoto(req, res, next) {
    try {
        const existingInstaller =
            await installerService.getInstallerByUserId(req.user.id);

        if (!existingInstaller) {
            return res.status(404).json({
                success: false,
                message: "Installer profile not found."
            });
        }

        let photoUrl = "";

        if (req.file) {
            photoUrl = `/uploads/${req.file.filename}`;
        } else if (req.body && (req.body.photoBase64 || req.body.profileImage || req.body.image)) {
            const rawBase64 = req.body.photoBase64 || req.body.profileImage || req.body.image;
            try {
                photoUrl = saveBase64Image(rawBase64, `installer-${existingInstaller.installer_code || existingInstaller.id}`);
            } catch (err) {
                return res.status(400).json({
                    success: false,
                    message: err.message
                });
            }
            if (!photoUrl) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid image format. Supported formats: JPEG, PNG, WebP."
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                message: "No photo provided. Upload a file or send captured image data."
            });
        }

        const updatedInstaller = await installerService.updateInstaller(
            existingInstaller.id,
            { profileImage: photoUrl }
        );

        res.status(200).json({
            success: true,
            message: "Installer profile photo successfully captured and saved.",
            photoUrl: photoUrl,
            data: {
                profileImage: photoUrl,
                installer: updatedInstaller
            }
        });
    } catch (error) {
        next(error);
    }
}

/* =========================================================
   REQUEST PROFILE / BANKING CHANGE FROM ADMIN
========================================================= */

async function requestProfileChange(req, res, next) {
    try {
        const existingInstaller =
            await installerService.getInstallerByUserId(
                req.user.id
            );

        if (!existingInstaller) {
            return res.status(404).json({
                success: false,
                message: "Installer profile not found."
            });
        }

        const { changeType, requestedValue, reason } = req.body;
        if (!changeType || !reason) {
            return res.status(400).json({
                success: false,
                message: "Change type and reason are required to submit an Admin Change Request."
            });
        }

        const timestamp = new Date().toLocaleString("en-GB");
        const logEntry = `[${timestamp}] Change Request for ${changeType}: "${requestedValue || 'N/A'}" | Reason: ${reason}`;
        const newNotes = existingInstaller.banking_change_note
            ? `${existingInstaller.banking_change_note}\n${logEntry}`
            : logEntry;

        await installerService.updateInstaller(existingInstaller.id, {
            bankingChangeNote: newNotes
        });

        try {
            await notificationService.createNotification({
                user_id: req.user.id,
                type: "system",
                title: `Change Request: ${changeType}`,
                message: `Your request to update ${changeType} has been submitted to the Admin. An administrator will review your request.`,
                priority: "normal"
            });
        } catch (nErr) {
            console.warn("Notification error:", nErr.message);
        }

        res.status(200).json({
            success: true,
            message: "Your change request has been submitted to Admin. An administrator will review and grant permission if approved.",
            data: {
                changeType,
                requestedValue,
                reason,
                status: "pending_review"
            }
        });

    } catch (error) {
        next(error);
    }
}

/* =========================================================
   GET ALL INSTALLERS
   STAFF / ADMIN
========================================================= */

async function getAllInstallers(req, res, next) {
    try {
        const installers =
            await installerService.getAllInstallers();

        res.status(200).json({
            success: true,
            message: "Installers retrieved successfully.",
            data: {
                installers,
                count: installers.length
            }
        });

    } catch (error) {
        next(error);
    }
}

/* =========================================================
   SEARCH INSTALLERS
   STAFF / ADMIN
========================================================= */

async function searchInstallers(req, res, next) {
    try {
        const search =
            typeof req.query.q === "string"
                ? req.query.q.trim()
                : "";

        if (!search) {
            return res.status(400).json({
                success: false,
                message: "Search query is required."
            });
        }

        if (search.length < 2) {
            return res.status(400).json({
                success: false,
                message:
                    "Search query must contain at least 2 characters."
            });
        }

        const installers =
            await installerService.searchInstallers(
                search
            );

        res.status(200).json({
            success: true,
            message: "Installer search completed successfully.",
            data: {
                installers,
                count: installers.length,
                query: search
            }
        });

    } catch (error) {
        next(error);
    }
}

/* =========================================================
   GET INSTALLER BY ID
   STAFF / ADMIN
========================================================= */

async function getInstallerById(req, res, next) {
    try {
        const installer =
            await installerService.getInstallerById(
                req.params.id
            );

        if (!installer) {
            return res.status(404).json({
                success: false,
                message: "Installer not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Installer retrieved successfully.",
            data: installer
        });

    } catch (error) {
        next(error);
    }
}

/* =========================================================
   GET INSTALLER BY CODE
   STAFF / ADMIN
========================================================= */

async function getInstallerByCode(req, res, next) {
    try {
        const installer =
            await installerService.getInstallerByCode(
                req.params.installerCode
            );

        if (!installer) {
            return res.status(404).json({
                success: false,
                message: "Installer not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Installer retrieved successfully.",
            data: installer
        });

    } catch (error) {
        next(error);
    }
}

/* =========================================================
   CREATE INSTALLER
   ADMIN ONLY
========================================================= */

async function createInstaller(req, res, next) {
    try {
        const installer =
            await installerService.createInstaller(
                req.body
            );

        res.status(201).json({
            success: true,
            message: "Installer created successfully.",
            data: installer
        });

    } catch (error) {
        next(error);
    }
}

/* =========================================================
   UPDATE INSTALLER
   ADMIN ONLY
========================================================= */

async function updateInstaller(req, res, next) {
    try {
        const existingInstaller =
            await installerService.getInstallerById(
                req.params.id
            );

        if (!existingInstaller) {
            return res.status(404).json({
                success: false,
                message: "Installer not found."
            });
        }

        const installer =
            await installerService.updateInstaller(
                req.params.id,
                req.body
            );

        if (!installer) {
            return res.status(404).json({
                success: false,
                message: "Installer not found."
            });
        }

        const previousVerification = String(
            existingInstaller.verification_status ||
            existingInstaller.verificationStatus ||
            ""
        ).toLowerCase();

        const currentVerification = String(
            installer.verification_status ||
            installer.verificationStatus ||
            ""
        ).toLowerCase();

        const previousBankingStatus = String(
            existingInstaller.banking_verification_status ||
            existingInstaller.bankingVerificationStatus ||
            "verified"
        ).toLowerCase();

        const currentBankingStatus = String(
            installer.banking_verification_status ||
            installer.bankingVerificationStatus ||
            "verified"
        ).toLowerCase();

        if (
            previousVerification !== "verified" &&
            currentVerification === "verified"
        ) {
            await notificationService.createNotification({
                user_id: existingInstaller.user_id,
                type: "installer",
                title: "Installer profile verified",
                message: "Your installer profile has been verified. You can now access verified installer opportunities in the portal.",
                action_url: "/installer/portal#profile",
                action_label: "View profile",
                priority: "high"
            });
        }

        if (
            previousBankingStatus === "pending" &&
            currentBankingStatus === "verified"
        ) {
            await notificationService.createNotification({
                user_id: existingInstaller.user_id,
                type: "installer",
                title: "Settlement account verified",
                message: "Your settlement account has been reviewed and verified by admin.",
                action_url: "/installer/portal#profile",
                action_label: "View settlement account",
                priority: "high"
            });
        }

        res.status(200).json({
            success: true,
            message: "Installer updated successfully.",
            data: installer
        });

    } catch (error) {
        next(error);
    }
}

/* =========================================================
   DELETE INSTALLER
   ADMIN ONLY
========================================================= */

async function deleteInstaller(req, res, next) {
    try {
        const deleted =
            await installerService.deleteInstaller(
                req.params.id
            );

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Installer not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Installer deleted successfully.",
            data: {
                id: deleted.id
            }
        });

    } catch (error) {
        next(error);
    }
}

/* =========================================================
   SEND NOTIFICATION TO INSTALLER
   ADMIN ONLY
========================================================= */

async function sendNotificationToInstaller(req, res, next) {
    try {
        const installerId = req.params.id;
        const installer = await installerService.getInstallerById(installerId) || await installerService.getInstallerByCode(installerId);

        if (!installer) {
            return res.status(404).json({
                success: false,
                message: "Installer not found."
            });
        }

        const title = String(req.body?.title || "").trim();
        const message = String(req.body?.message || "").trim();
        const priority = ["low", "normal", "high", "urgent"].includes(req.body?.priority)
            ? req.body.priority
            : "normal";
        const type = req.body?.type || "installer";
        const actionUrl = req.body?.actionUrl || req.body?.action_url || "/installer/portal#profile";
        const actionLabel = req.body?.actionLabel || req.body?.action_label || "View Details";

        if (!title || title.length > 150) {
            return res.status(400).json({
                success: false,
                message: "Notification title is required and must be 150 characters or fewer."
            });
        }

        if (!message || message.length > 3000) {
            return res.status(400).json({
                success: false,
                message: "Notification message is required and must be 3,000 characters or fewer."
            });
        }

        const notification = await notificationService.createNotification({
            user_id: installer.user_id,
            type,
            title,
            message,
            action_url: actionUrl,
            action_label: actionLabel,
            priority
        });

        res.status(201).json({
            success: true,
            message: `Notification successfully delivered to ${installer.contact_name || installer.company_name || 'installer'}.`,
            data: notification
        });

    } catch (error) {
        next(error);
    }
}

/* =========================================================
   INSTALLER PORTAL — JOBS
========================================================= */

async function getInstallerJobs(req, res, next) {
    try {
        const jobs =
            await installerService.getInstallerJobs(
                req.user.id
            );

        res.status(200).json({
            success: true,
            message: "Installer jobs retrieved successfully.",
            data: {
                jobs,
                count: jobs.length
            }
        });

    } catch (error) {
        next(error);
    }
}


/* =========================================================
   ACCEPT INSTALLER JOB
========================================================= */

async function acceptInstallerJob(req, res, next) {
    try {
        const job =
            await installerService.acceptInstallerJob(
                req.user.id,
                req.params.id
            );

        if (!job) {
            return res.status(404).json({
                success: false,
                message:
                    "Job is unavailable or has already been assigned."
            });
        }

        res.status(200).json({
            success: true,
            message: "Job accepted successfully.",
            data: job
        });

    } catch (error) {
        next(error);
    }
}


/* =========================================================
   INSTALLER PORTAL â€” DOCUMENTS
========================================================= */

async function getInstallerDocuments(req, res, next) {
    try {
        const documents =
            await installerService.getInstallerDocuments(
                req.user.id
            );

        res.status(200).json({
            success: true,
            message:
                "Installer documents retrieved successfully.",
            data: {
                documents,
                count: documents.length
            }
        });

    } catch (error) {
        next(error);
    }
}


/* =========================================================
   INSTALLER PORTAL â€” COMMISSIONING
========================================================= */

async function getInstallerCommissioning(req, res, next) {
    try {
        const commissioning =
            await installerService.getInstallerCommissioning(
                req.user.id
            );

        res.status(200).json({
            success: true,
            message:
                "Commissioning records retrieved successfully.",
            data: {
                commissioning,
                count: commissioning.length
            }
        });

    } catch (error) {
        next(error);
    }
}

async function saveCommissioning(req, res, next) {
    try {
        const result = await installerService.saveCommissioning(
            req.user.id,
            req.body || {}
        );

        res.status(200).json({
            success: true,
            message: "Project commissioning signed off and recorded successfully.",
            data: result
        });
    } catch (error) {
        next(error);
    }
}


/* =========================================================
   INSTALLER PORTAL â€” PAYMENTS
========================================================= */

async function getInstallerPayments(req, res, next) {
    try {
        const payments =
            await installerService.getInstallerPayments(
                req.user.id
            );

        res.status(200).json({
            success: true,
            message:
                "Installer payments retrieved successfully.",
            data: {
                payments,
                count: payments.length
            }
        });

    } catch (error) {
        next(error);
    }
}


/* =========================================================
   INSTALLER PORTAL â€” NOTIFICATIONS
========================================================= */

async function getInstallerNotifications(req, res, next) {
    try {
        const notifications =
            await installerService.getInstallerNotifications(
                req.user.id
            );

        res.status(200).json({
            success: true,
            message:
                "Installer notifications retrieved successfully.",
            data: {
                notifications,
                count: notifications.length
            }
        });

    } catch (error) {
        next(error);
    }
}


/* =========================================================
   INSTALLER PORTAL â€” ACTIVITY
========================================================= */

async function getInstallerActivity(req, res, next) {
    try {
        const activity =
            await installerService.getInstallerActivity(
                req.user.id
            );

        res.status(200).json({
            success: true,
            message:
                "Installer activity retrieved successfully.",
            data: {
                activity,
                count: activity.length
            }
        });

    } catch (error) {
        next(error);
    }
}

/* =========================================================
   GET BEFITTED INSTALLER (Distance & Suitability)
========================================================= */

async function getBefittedInstaller(req, res, next) {
    try {
        const city = req.query.city || "Abuja";
        const state = req.query.state || "Abuja";
        const localGovernment = req.query.localGovernment || req.query.local_government || "Amac";
        const projectType = req.query.projectType || req.query.project_type || "solar";
        const capacityKw = Number(req.query.capacityKw || req.query.capacity_kw || 16);

        const installer = await installerService.getBefittedInstaller({
            city,
            state,
            localGovernment,
            projectType,
            capacityKw
        });

        if (!installer) {
            return res.status(404).json({
                success: false,
                message: "No suitable verified installer found in backend store."
            });
        }

        res.status(200).json({
            success: true,
            message: "Befitted installer retrieved from backend store successfully.",
            data: {
                installer,
                proximity_score: "Nearest Base (2.4 km)",
                operating_location: `${installer.city || installer.local_government || 'Maitama'}, ${installer.state || 'Abuja FCT'}`
            }
        });
    } catch (error) {
        next(error);
    }
}

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
    getMyInstaller,
    updateMyInstaller,
    uploadProfilePhoto,
    requestProfileChange,

    getAllInstallers,
    searchInstallers,
    getInstallerById,
    getInstallerByCode,
    getBefittedInstaller,

    createInstaller,
    updateInstaller,
    deleteInstaller,
    sendNotificationToInstaller,

    getInstallerJobs,
    acceptInstallerJob,
    getInstallerDocuments,
    getInstallerCommissioning,
    saveCommissioning,
    getInstallerPayments,
    getInstallerNotifications,
    getInstallerActivity
};




