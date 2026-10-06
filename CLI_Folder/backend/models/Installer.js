"use strict";

/* =========================================================
   AE RENEWABLE NETWORK
   INSTALLER MODEL
========================================================= */

class Installer {
    constructor(data = {}) {
        this.id = data.id || null;

        this.userId =
            data.userId ||
            data.user_id ||
            null;

        this.installerCode =
            data.installerCode ||
            data.installer_code ||
            null;

        this.companyName =
            data.companyName ||
            data.company_name ||
            "";

        this.contactName =
            data.contactName ||
            data.contact_name ||
            "";

        this.email =
            data.email ||
            "";

        this.phone =
            data.phone ||
            "";

        this.rcNumber =
            data.rcNumber ||
            data.rc_number ||
            null;

        this.cacCertificateUrl =
            data.cacCertificateUrl ||
            data.cac_certificate_url ||
            null;

        this.professionalCertificateUrl =
            data.professionalCertificateUrl ||
            data.professional_certificate_url ||
            null;

        this.address =
            data.address ||
            null;

        this.city =
            data.city ||
            null;

        this.state =
            data.state ||
            null;

        this.localGovernment =
            data.localGovernment ||
            data.local_government ||
            null;

        this.country =
            data.country ||
            "Nigeria";

        this.bankName =
            data.bankName ||
            data.bank_name ||
            null;

        this.accountName =
            data.accountName ||
            data.account_name ||
            null;

        this.accountNumber =
            data.accountNumber ||
            data.account_number ||
            null;

        this.accountBvn =
            data.accountBvn ||
            data.account_bvn ||
            null;

        this.bankingVerificationStatus =
            data.bankingVerificationStatus ||
            data.banking_verification_status ||
            "verified";

        this.bankingChangeNote =
            data.bankingChangeNote ||
            data.banking_change_note ||
            null;

        this.verificationStatus =
            data.verificationStatus ||
            data.verification_status ||
            "pending";

        this.specializations =
            Array.isArray(data.specializations)
                ? data.specializations
                : [];

        this.status =
            data.status ||
            "pending";

        this.groupPosition =
            data.groupPosition ||
            data.group_position ||
            null;

        this.registrationDate =
            data.registrationDate ||
            data.registration_date ||
            null;

        this.approvalDate =
            data.approvalDate ||
            data.approval_date ||
            null;

        this.profileImage =
            data.profileImage ||
            data.profile_image ||
            null;

        this.notes =
            data.notes ||
            null;

        this.createdAt =
            data.createdAt ||
            data.created_at ||
            null;

        this.updatedAt =
            data.updatedAt ||
            data.updated_at ||
            null;
    }

    /* =====================================================
       NORMALIZE
    ===================================================== */

    normalize() {
        this.installerCode =
            this.installerCode
                ? String(this.installerCode).trim().toUpperCase()
                : null;

        this.companyName =
            String(this.companyName || "").trim();

        this.contactName =
            String(this.contactName || "").trim();

        this.email =
            String(this.email || "").trim().toLowerCase();

        this.phone =
            String(this.phone || "").trim();

        this.rcNumber =
            this.rcNumber
                ? String(this.rcNumber).trim().toUpperCase()
                : null;

        this.state =
            this.state
                ? String(this.state).trim()
                : null;

        this.localGovernment =
            this.localGovernment
                ? String(this.localGovernment).trim()
                : null;

        this.country =
            String(this.country || "Nigeria").trim();

        this.specializations =
            Array.isArray(this.specializations)
                ? this.specializations
                    .map(item => String(item).trim())
                    .filter(Boolean)
                : [];

        return this;
    }

    /* =====================================================
       VALIDATION
    ===================================================== */

    isValid() {
        return Boolean(
            this.userId &&
            this.installerCode &&
            this.companyName &&
            this.contactName &&
            this.email &&
            this.phone
        );
    }

    /* =====================================================
       DATABASE FORMAT
    ===================================================== */

    toDatabase() {
        return {
            userId: this.userId,
            installerCode: this.installerCode,
            companyName: this.companyName,
            contactName: this.contactName,
            email: this.email,
            phone: this.phone,
            rcNumber: this.rcNumber,
            cacCertificateUrl: this.cacCertificateUrl,
            professionalCertificateUrl:
                this.professionalCertificateUrl,
            address: this.address,
            city: this.city,
            state: this.state,
            localGovernment: this.localGovernment,
            country: this.country,
            bankName: this.bankName,
            accountName: this.accountName,
            accountNumber: this.accountNumber,
            accountBvn: this.accountBvn,
            bankingVerificationStatus:
                this.bankingVerificationStatus,
            bankingChangeNote:
                this.bankingChangeNote,
            verificationStatus:
                this.verificationStatus,
            specializations:
                this.specializations,
            status: this.status,
            groupPosition:
                this.groupPosition,
            registrationDate:
                this.registrationDate,
            approvalDate:
                this.approvalDate,
            profileImage:
                this.profileImage,
            notes: this.notes
        };
    }

    /* =====================================================
       JSON FORMAT
    ===================================================== */

    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            installerCode: this.installerCode,
            companyName: this.companyName,
            contactName: this.contactName,
            email: this.email,
            phone: this.phone,
            rcNumber: this.rcNumber,
            cacCertificateUrl: this.cacCertificateUrl,
            professionalCertificateUrl:
                this.professionalCertificateUrl,
            address: this.address,
            city: this.city,
            state: this.state,
            localGovernment:
                this.localGovernment,
            country: this.country,
            bankName: this.bankName,
            accountName: this.accountName,
            accountNumber: this.accountNumber,
            accountBvn: this.accountBvn,
            bankingVerificationStatus:
                this.bankingVerificationStatus,
            bankingChangeNote:
                this.bankingChangeNote,
            verificationStatus:
                this.verificationStatus,
            specializations:
                this.specializations,
            status: this.status,
            groupPosition:
                this.groupPosition,
            registrationDate:
                this.registrationDate,
            approvalDate:
                this.approvalDate,
            profileImage:
                this.profileImage,
            notes: this.notes,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

/* =========================================================
   EXPORT
========================================================= */

module.exports = Installer;
