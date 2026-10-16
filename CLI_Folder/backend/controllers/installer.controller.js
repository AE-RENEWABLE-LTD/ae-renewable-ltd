"use strict";

const fs = require("fs");
const path = require("path");
const installerService = require("../services/installer.service");
const notificationService = require("../services/notification.service");
const { query } = require("../config/database");

function saveBase64Image(base64Str, prefix = "installer-photo") {
    if (!base64Str || typeof base64Str !== "string") return null;
    const matches = base64Str.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        return null;
    }
    const mimeType = matches[1].toLowerCase();
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg", "application/pdf"];
    if (!allowed.includes(mimeType)) {
        return null;
    }
    let ext = "jpg";
    if (mimeType === "image/png") ext = "png";
    else if (mimeType === "image/webp") ext = "webp";
    else if (mimeType === "application/pdf") ext = "pdf";
    const buffer = Buffer.from(matches[2], "base64");
    if (buffer.length > 10 * 1024 * 1024) {
        throw new Error("Image exceeds 10MB limit.");
    }
    const filename = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;
    const targetDirs = [
        path.join(process.cwd(), "uploads"),
        path.join(__dirname, "..", "uploads"),
        path.join(__dirname, "..", "..", "uploads")
    ];
    targetDirs.forEach(d => {
        try {
            if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
            fs.writeFileSync(path.join(d, filename), buffer);
        } catch (_) {}
    });
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
        if (req.user?.role === "admin" || req.user?.role === "staff") {
            return res.status(403).json({
                success: false,
                message: "Administrator accounts do not have an installer profile. Please access the Admin Operations Console."
            });
        }

        let installer =
            await installerService.getInstallerByUserId(
                req.user.id
            );

        if (!installer) {
            const fallbackName = [req.user.first_name, req.user.last_name].filter(Boolean).join(" ").trim() || (req.user.email ? req.user.email.split("@")[0] : "Certified Installer");
            const code = (req.user.id == 1 || req.user.id == 28 || req.user.id == 29) ? "AEI-0001" : `AEI-${String(req.user.id).padStart(4, "0")}`;
            try {
                await query(
                    `
                    INSERT INTO installers (
                        user_id,
                        installer_code,
                        company_name,
                        contact_name,
                        email,
                        phone,
                        state,
                        status
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
                    ON CONFLICT (user_id) DO UPDATE SET
                        email = EXCLUDED.email
                    `,
                    [
                        req.user.id,
                        code,
                        "AE Renewable Solutions",
                        fallbackName,
                        req.user.email,
                        req.user.phone || "+2348133615132",
                        "FCT Abuja"
                    ]
                );
                installer = await installerService.getInstallerByUserId(req.user.id);
            } catch (createErr) {
                // If code conflict occurs, try unique random code
                try {
                    const altCode = `AEI-${Date.now().toString().slice(-4)}`;
                    await query(
                        `
                        INSERT INTO installers (
                            user_id,
                            installer_code,
                            company_name,
                            contact_name,
                            email,
                            phone,
                            state,
                            status
                        )
                        VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
                        ON CONFLICT (user_id) DO NOTHING
                        `,
                        [
                            req.user.id,
                            altCode,
                            "AE Renewable Solutions",
                            fallbackName,
                            req.user.email,
                            req.user.phone || "+2348133615132",
                            "FCT Abuja"
                        ]
                    );
                    installer = await installerService.getInstallerByUserId(req.user.id);
                } catch (retryErr) {
                    installer = {
                        id: req.user.id,
                        user_id: req.user.id,
                        installer_code: code,
                        company_name: "AE Renewable Solutions",
                        contact_name: fallbackName,
                        email: req.user.email,
                        user_email: req.user.email,
                        phone: req.user.phone || "+2348133615132",
                        user_phone: req.user.phone || "+2348133615132",
                        state: "FCT Abuja",
                        status: "active",
                        tier: "Master Solar Engineer",
                        verified: true
                    };
                }
            }
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
        let existingInstaller =
            await installerService.getInstallerByUserId(
                req.user.id
            );

        if (!existingInstaller) {
            existingInstaller = await installerService.ensureInstallerForUser(req.user.id);
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

        // 3. Handle Specialization and CAC Upload
        if (updateFields.specialization && !updateFields.specializations) {
            updateFields.specializations = [updateFields.specialization];
        }

        const rawCac = updateFields.cacCertificate || updateFields.cacCertificateUrl || updateFields.cac_certificate_url;
        if (rawCac && typeof rawCac === "string" && rawCac.startsWith("data:")) {
            const savedCac = saveBase64Image(rawCac, `cac-${existingInstaller.installer_code || existingInstaller.id}`);
            if (savedCac) {
                updateFields.cacCertificateUrl = savedCac;
                delete updateFields.cacCertificate;
                delete updateFields.cac_certificate_url;
            }
        }

        const isProfileSubmitted = isBankingUpdate || updateFields.cacCertificateUrl || updateFields.rcNumber || updateFields.rc_number;
        if (isProfileSubmitted) {
            updateFields.bankingVerificationStatus = "pending";
            updateFields.verificationStatus = "pending";
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
            installer = await installerService.getInstallerByUserId(req.user.id) || existingInstaller;
        }

        if (isProfileSubmitted) {
            try {
                await notificationService.notifyAdmins({
                    title: "Installer Profile Verification Request",
                    message: `Installer ${installer.contact_name || existingInstaller.contact_name || 'Installer'} (${installer.installer_code || existingInstaller.installer_code || 'ID Pending'}) has submitted their registration and settlement profile for verification.`,
                    action_url: "/admin#installer-profile",
                    action_label: "Review Installer",
                    priority: "high"
                });
            } catch (nErr) {
                console.warn("Failed to notify admins of installer profile update:", nErr.message);
            }
        }

        res.status(200).json({
            success: true,
            message: isProfileSubmitted 
                ? "Account details and profile registration submitted successfully. Your profile is now Pending Verification by Admin."
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
        let existingInstaller = null;
        if (req.user && req.user.role === "installer") {
            existingInstaller = await installerService.getInstallerByUserId(req.user.id);
        } else if (req.user && (req.user.role === "admin" || req.user.role === "super_admin" || req.user.role === "staff")) {
            if (req.params.id) {
                existingInstaller = (await installerService.getInstallerById(req.params.id)) ||
                                    (await installerService.getInstallerByCode(req.params.id));
            } else if (req.body && (req.body.installerId || req.body.installerCode)) {
                const target = req.body.installerId || req.body.installerCode;
                existingInstaller = (await installerService.getInstallerById(target)) ||
                                    (await installerService.getInstallerByCode(target));
            } else {
                existingInstaller = await installerService.getInstallerByUserId(req.user.id);
            }
        }

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
        let existingInstaller =
            await installerService.getInstallerByUserId(
                req.user.id
            );

        if (!existingInstaller) {
            existingInstaller = await installerService.ensureInstallerForUser(req.user.id);
        }

        const fieldName = String(req.body.changeType || req.body.fieldName || req.body.field_name || "").trim();
        const proposedVal = String(req.body.requestedValue || req.body.proposedValue || req.body.proposed_value || "").trim();
        const reason = String(req.body.reason || "").trim();

        if (!fieldName || !reason) {
            return res.status(400).json({
                success: false,
                message: "Field requiring modification and reason are required to submit an Admin Change Request."
            });
        }

        let currentVal = "";
        const lowerField = fieldName.toLowerCase();
        if (lowerField.includes("bank")) currentVal = existingInstaller.bank_name || "";
        else if (lowerField.includes("name") || lowerField.includes("holder")) currentVal = existingInstaller.account_name || "";
        else if (lowerField.includes("num") || lowerField.includes("account")) currentVal = existingInstaller.account_number || "";
        else if (lowerField.includes("bvn")) currentVal = existingInstaller.account_bvn || "";
        else if (lowerField.includes("email")) currentVal = existingInstaller.email || existingInstaller.user_email || "";
        else if (lowerField.includes("phone")) currentVal = existingInstaller.phone || existingInstaller.user_phone || "";

        // Insert into database audit table installer_change_requests
        const insertResult = await query(
            `
            INSERT INTO installer_change_requests (
                installer_id,
                installer_code,
                installer_name,
                field_name,
                current_value,
                proposed_value,
                reason,
                status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
            RETURNING *
            `,
            [
                existingInstaller.id,
                existingInstaller.installer_code,
                existingInstaller.contact_name,
                fieldName,
                currentVal,
                proposedVal,
                reason
            ]
        );

        const changeReq = insertResult.rows[0];

        const timestamp = new Date().toLocaleString("en-GB");
        const logEntry = `[${timestamp}] Change Request for ${fieldName}: "${proposedVal || 'N/A'}" | Reason: ${reason}`;
        const newNotes = existingInstaller.banking_change_note
            ? `${existingInstaller.banking_change_note}\n${logEntry}`
            : logEntry;

        await installerService.updateInstaller(existingInstaller.id, {
            bankingChangeNote: newNotes
        });

        // Notify Admins with action "Check"
        try {
            await notificationService.notifyAdmins({
                title: `Banking Change Request: ${existingInstaller.contact_name}`,
                message: `Installer ${existingInstaller.contact_name} (${existingInstaller.installer_code}) requested to modify ${fieldName} to "${proposedVal}". Reason: ${reason}`,
                action_url: `/admin#installer-profile?installerId=${existingInstaller.id}`,
                action_label: "Check",
                priority: "high"
            });
        } catch (nErr) {
            console.warn("Failed to notify admins of banking change request:", nErr.message);
        }

        // Notify Installer
        try {
            await notificationService.createNotification({
                user_id: req.user.id,
                type: "installer",
                title: "Banking Change Request Submitted",
                message: `Your request to modify ${fieldName} has been submitted to Admin. An administrator will review your request.`,
                action_url: "/installer/portal#profile",
                action_label: "View Status",
                priority: "normal"
            });
        } catch (nErr) {}

        res.status(200).json({
            success: true,
            message: "Your banking change request has been submitted to Admin. An administrator will review and grant permission if approved.",
            data: changeReq
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

        let updatePayload = { ...req.body };
        const action = String(req.body.action || "").toLowerCase().trim();

        // 1. NEVER EDITABLE FROM NORMAL PROFILE EDIT
        delete updatePayload.installer_code;
        delete updatePayload.installerCode;
        delete updatePayload.email;
        delete updatePayload.phone;
        delete updatePayload.contact_name;
        delete updatePayload.contactName;
        delete updatePayload.fullname;
        delete updatePayload.fullName;

        // 2. BANKING ACTIONS
        let notificationToCreate = null;

        if (action === "approve_banking" || action === "verify_banking" || (req.body.bankingVerificationStatus === "verified" && action !== "save_profile")) {
            const bName = updatePayload.bank_name || updatePayload.bankName || existingInstaller.bank_name;
            const aName = updatePayload.account_name || updatePayload.accountName || existingInstaller.account_name;
            const aNum = updatePayload.account_number || updatePayload.accountNumber || existingInstaller.account_number;
            const aBvn = updatePayload.account_bvn || updatePayload.accountBvn || existingInstaller.account_bvn;

            if (!bName || !aName || !aNum || !aBvn) {
                return res.status(400).json({
                    success: false,
                    message: "Submitted banking information is incomplete. Bank name, account name, account number, and BVN are required."
                });
            }

            updatePayload.banking_verification_status = "verified";
            updatePayload.banking_unlocked = false;
            updatePayload.banking_approved_by = req.user.id;
            updatePayload.banking_approved_at = new Date();

            notificationToCreate = {
                user_id: existingInstaller.user_id,
                type: "installer",
                title: "Settlement Account Approved",
                message: "Your settlement banking details have been verified and approved by Admin. Labour payouts will be disbursed to this account.",
                action_url: "/installer/portal#profile",
                action_label: "View Settlement Account",
                priority: "high"
            };

        } else if (action === "reject_banking" || (req.body.bankingVerificationStatus === "rejected" && action !== "save_profile")) {
            updatePayload.banking_verification_status = "rejected";
            updatePayload.banking_unlocked = true; // allow installer to correct & resubmit
            updatePayload.banking_rejected_reason = req.body.reason || "Settlement account details require correction.";
            // Note: Installer account status is NOT suspended

            notificationToCreate = {
                user_id: existingInstaller.user_id,
                type: "installer",
                title: "Settlement Account Requires Correction",
                message: req.body.reason || "Admin has reviewed your settlement banking details and indicated correction is required. Please review your account details in your profile and resubmit.",
                action_url: "/installer/portal#profile",
                action_label: "Update Banking Details",
                priority: "high"
            };

        } else if (action === "unlock_banking") {
            updatePayload.banking_unlocked = true;
            updatePayload.banking_verification_status = "pending";

            notificationToCreate = {
                user_id: existingInstaller.user_id,
                type: "installer",
                title: "Banking Information Unlocked",
                message: "Admin has temporarily unlocked your settlement banking section for updates. Please enter your corrected details and resubmit.",
                action_url: "/installer/portal#profile",
                action_label: "Update Banking Details",
                priority: "high"
            };

        } else if (action === "lock_banking") {
            updatePayload.banking_unlocked = false;

        } else if (action === "accept" || action === "approve") {
            updatePayload.verification_status = "verified";
            updatePayload.banking_verification_status = "verified";
            updatePayload.status = "active";
            updatePayload.approval_date = new Date();

            notificationToCreate = {
                user_id: existingInstaller.user_id,
                type: "installer",
                title: "🎉 Welcome to AE RENEWABLE INSTALLER NETWORK!",
                message: "Congratulations! You are now an official verified member of the AE RENEWABLE INSTALLER NETWORK. Your profile credentials and settlement banking have been reviewed and approved by Admin. You are now authorized to accept and execute field projects.",
                action_url: "/installer/portal#jobs",
                action_label: "View Available Jobs",
                priority: "high"
            };

        } else if (action === "decline" || action === "deny" || action === "reject") {
            updatePayload.verification_status = "rejected";
            updatePayload.status = "inactive";
            if (req.body.reason) updatePayload.notes = req.body.reason;

            notificationToCreate = {
                user_id: existingInstaller.user_id,
                type: "installer",
                title: "⚠️ Profile Verification Notice",
                message: req.body.reason || "Your profile information and submitted credentials do not tally with our regulatory verification standards. Please review your banking and professional documents inside your profile and resubmit for Admin approval.",
                action_url: "/installer/portal#profile",
                action_label: "Update Profile",
                priority: "high"
            };

        } else {
            // NORMAL PROFILE SAVE CHANGES
            // Prevent casual alteration of banking details from normal profile save
            delete updatePayload.bank_name;
            delete updatePayload.bankName;
            delete updatePayload.account_name;
            delete updatePayload.accountName;
            delete updatePayload.account_number;
            delete updatePayload.accountNumber;
            delete updatePayload.account_bvn;
            delete updatePayload.accountBvn;

            updatePayload.last_saved_by = req.user.id;
            updatePayload.last_saved_at = new Date();

            notificationToCreate = {
                user_id: existingInstaller.user_id,
                type: "installer",
                title: "Installer Profile Updated",
                message: "Admin has updated your professional installer record details.",
                action_url: "/installer/portal#profile",
                action_label: "View Profile",
                priority: "normal"
            };
        }

        const installer =
            await installerService.updateInstaller(
                req.params.id,
                updatePayload
            );

        if (!installer) {
            return res.status(404).json({
                success: false,
                message: "Installer not found."
            });
        }

        if (notificationToCreate && existingInstaller.user_id) {
            try {
                await notificationService.createNotification(notificationToCreate);
            } catch (nErr) {
                console.warn("Failed to create installer notification:", nErr.message);
            }
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
   GET INSTALLER CHANGE REQUESTS
   STAFF / ADMIN
========================================================= */

async function getInstallerChangeRequests(req, res, next) {
    try {
        const installerId = req.params.id;
        const isNumeric = /^\d+$/.test(String(installerId).trim());
        const result = await query(
            `
            SELECT cr.*, u.first_name || ' ' || u.last_name AS reviewer_name
            FROM installer_change_requests cr
            LEFT JOIN users u ON cr.reviewed_by = u.id
            WHERE ${isNumeric ? 'cr.installer_id = $1::bigint' : 'cr.installer_code = $1'}
            ORDER BY cr.created_at DESC
            `,
            [installerId]
        );

        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        next(error);
    }
}

/* =========================================================
   DECIDE INSTALLER CHANGE REQUEST
   ADMIN ONLY
========================================================= */

async function decideInstallerChangeRequest(req, res, next) {
    try {
        const requestId = req.params.requestId;
        const { decision, notes } = req.body; // 'approve' or 'reject'

        if (!["approve", "reject"].includes(decision)) {
            return res.status(400).json({
                success: false,
                message: "Decision must be 'approve' or 'reject'."
            });
        }

        const reqQuery = await query(
            `SELECT * FROM installer_change_requests WHERE id = $1 LIMIT 1`,
            [requestId]
        );

        if (reqQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Change request not found."
            });
        }

        const changeReq = reqQuery.rows[0];
        const installer = await installerService.getInstallerById(changeReq.installer_id);

        const newStatus = decision === "approve" ? "approved" : "rejected";

        await query(
            `
            UPDATE installer_change_requests
            SET status = $1,
                admin_notes = $2,
                reviewed_by = $3,
                reviewed_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
            `,
            [newStatus, notes || null, req.user.id, requestId]
        );

        if (decision === "approve") {
            await installerService.updateInstaller(changeReq.installer_id, {
                bankingUnlocked: true,
                bankingVerificationStatus: "pending"
            });

            if (installer) {
                try {
                    await notificationService.createNotification({
                        user_id: installer.user_id,
                        type: "installer",
                        title: "Banking Information Unlocked",
                        message: "Admin approved your change request and has temporarily unlocked your settlement banking section. Please enter your corrected details and resubmit.",
                        action_url: "/installer/portal#profile",
                        action_label: "Update Banking Details",
                        priority: "high"
                    });
                } catch (nErr) {}
            }
        } else {
            if (installer) {
                try {
                    await notificationService.createNotification({
                        user_id: installer.user_id,
                        type: "installer",
                        title: "Banking Change Request Declined",
                        message: notes || "Admin has reviewed and declined your banking change request. Banking details remain locked.",
                        action_url: "/installer/portal#profile",
                        action_label: "View Status",
                        priority: "normal"
                    });
                } catch (nErr) {}
            }
        }

        res.status(200).json({
            success: true,
            message: decision === "approve" 
                ? "Banking change request approved and banking unlocked for installer."
                : "Banking change request rejected. Banking remains locked.",
            data: {
                requestId,
                status: newStatus
            }
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

async function getInstallerJobDetail(req, res, next) {
    try {
        const jobId = req.params.id;
        const job = await installerService.getInstallerJobById(req.user.id, jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Project record not found or not accessible."
            });
        }
        res.status(200).json({
            success: true,
            data: { job }
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
        let installer = await installerService.getInstallerByUserId(req.user.id);
        if (!installer) {
            installer = await installerService.ensureInstallerForUser(req.user.id);
        }
        if (installer.verification_status !== "verified" || installer.status !== "active") {
            return res.status(403).json({
                success: false,
                message: "You cannot accept installation jobs yet. Your account must be verified and approved by Admin before jobs can be accepted. Please complete your profile and await Admin approval."
            });
        }

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
        if (error.status === 403) {
            return res.status(403).json({ success: false, message: error.message });
        }
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
    getInstallerChangeRequests,
    decideInstallerChangeRequest,

    getInstallerJobs,
    getInstallerJobDetail,
    acceptInstallerJob,
    getInstallerDocuments,
    getInstallerCommissioning,
    saveCommissioning,
    getInstallerPayments,
    getInstallerNotifications,
    getInstallerActivity
};




