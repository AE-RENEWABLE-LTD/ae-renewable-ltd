"use strict";

const { query } = require("../config/database");

// Default initial posts
const DEFAULT_POSTS = [
    {
        id: "post-101",
        engineer_name: "Engr. Eniola Abdulrasaq",
        engineer_title: "NEMSA Certified Lead Installer",
        engineer_avatar: "/site-images/instalerface.jpeg",
        stage: "stage3",
        stage_title: "⚡ Stage 3: PV & Inverter Mount",
        location: "Maitama District, Abuja FCT",
        description: "Successfully deployed and mounted 24x 585W Tier-1 High-Efficiency Mono PERC Solar Panels on reinforced anodized aluminium railed roofing. Coupled with dual 12kW Deye Hybrid Inverters with smart MPPT multi-string tracking. Cable routing is securely insulated against harmonic loss.",
        tags: ["14.04 kWp Solar Array", "Dual 12kW Deye Hybrid", "6mm² Solar DC Cables"],
        image_url: "/site-images/panelUtako1.jpeg",
        client_feedback: "The team arrived punctually at 8:00 AM. Roof structural integrity check was done thoroughly before mounting. Our daytime air-conditioners are now running 100% directly off the sun.",
        client_rating: 5,
        resolution_note: "Audit Status: Passed Structural & Electrical Wind-Load Inspection",
        likes_count: 148,
        loves_count: 52,
        shares_count: 32,
        comments: [
            { author: "Architect Oladipo", text: "Super neat DC trunking along the parapet wall. Great engineering standard!", avatar: "AO" },
            { author: "Dr. Mohammed Kano", text: "Is this system compatible with 3-phase grid power synchronization?", avatar: "MK" }
        ],
        created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
    },
    {
        id: "post-102",
        engineer_name: "Engr. Solomon Abdulrasaq",
        engineer_title: "Certified Storage Specialist",
        engineer_avatar: "/site-images/installerface1.jpeg",
        stage: "stage4",
        stage_title: "🔋 Stage 4: Battery & BMS Wiring",
        location: "Victoria Island, Lagos State",
        description: "Completed multi-module rack installation of 30kWh Felicity LiFePO4 Ultra-High Capacity Battery Bank with CAN-bus communication linked directly to the primary power management system. 0ms uninterrupted switchover tested during sudden grid blackouts.",
        tags: ["30kWh LiFePO4 Storage", "6000+ Cycles (90% DoD)", "CAN / RS485 Dual Bus"],
        image_url: "/site-images/utakoinverterdone.jpeg",
        client_feedback: "Our main concern was our server room rebooting whenever NEPA took light. With this AE installation, the changeover is literally invisible. Our servers stayed online without dropping a single packet.",
        client_rating: 5,
        resolution_note: "Resolution: 0-Millisecond UPS Switching Verified by Telemetry",
        likes_count: 215,
        loves_count: 78,
        shares_count: 54,
        comments: [
            { author: "Chief Adeleke", text: "Incredible setup. How long does it take to charge from solar on a normal sunny day?", avatar: "CA" }
        ],
        created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
    },
    {
        id: "post-103",
        engineer_name: "Engr. Fabiyi Oluwasegun",
        engineer_title: "Certified Protection Tech",
        engineer_avatar: "/site-images/instaler2.jpeg",
        stage: "stage5",
        stage_title: "⚡ Stage 5: Earthing (<2Ω) & SPDs",
        location: "GRA Phase 2, Port Harcourt, Rivers State",
        description: "Deep copper rod earthing system driven into site substrate treated with Marconite compound, achieving an audited earth resistance of 1.48 Ohms (well below IEEE 2.0Ω safety ceiling). Installed heavy-duty DC and AC Class I+II surge arrestors for comprehensive lightning suppression.",
        tags: ["1.48Ω Earth Resistance", "Type 1+2 DC SPDs (1000V)", "Copper Earth Chamber"],
        image_url: "/site-images/electrical.jpg",
        client_feedback: "Last year lightning struck our transformer and blew our borehole pump and TV. AE Renewable made earthing and lightning protection their top priority. Very impressed with the digital tester verification.",
        client_rating: 5,
        resolution_note: "NEMSA Electrical Safety Code Compliant",
        likes_count: 189,
        loves_count: 64,
        shares_count: 41,
        comments: [],
        created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
    },
    {
        id: "post-104",
        engineer_name: "Engr. Stephen Akolade",
        engineer_title: "Certified Commissioning Officer",
        engineer_avatar: "/site-images/instaler3.jpeg",
        stage: "stage6",
        stage_title: "🏆 Stage 6: Testing & Handover",
        location: "Bodija Estate, Ibadan, Oyo State",
        description: "Final commissioning and client live orientation completed for 10kVA Turnkey Solar Facility. Full load test carried out at 8.2kW continuous draw with thermal imaging of all busbar connections showing optimal temperature margins (31°C). Wi-Fi telemetry activated for real-time mobile app monitoring.",
        tags: ["Thermal Imaging Verified", "8.2kW Live Stress Test", "Cloud Telemetry Enabled"],
        image_url: "/site-images/smartInverter.jpeg",
        client_feedback: "The handover was smooth and informative. Engr. Stephen walked me through the telemetry app so I can see exactly how many units our solar panels are generating every hour. Top class professional delivery!",
        client_rating: 5,
        resolution_note: "Official Certificate of Electrical Safety & Warranty Issued",
        likes_count: 342,
        loves_count: 110,
        shares_count: 88,
        comments: [],
        created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString()
    },
    {
        id: "post-105",
        engineer_name: "Engr. Eniola Abdulrasaq",
        engineer_title: "Certified Site Auditor",
        engineer_avatar: "/site-images/instaler5.jpeg",
        stage: "stage1",
        stage_title: "🔍 Stage 1: Site Audit & Structural",
        location: "Gombe Central Commercial Hub, Gombe",
        description: "Comprehensive geotechnical and roof structural load assessment performed for a 45kW commercial mini-grid facility. Solar irradiance measured at 5.8 kWh/m²/day. Rafter stress distribution calculations mapped in ARDE Studio before finalizing mounting anchors.",
        tags: ["5.8 kWh/m²/day Peak Sun", "ARDE Structural Simulation", "Zero Roof Puncture Framing"],
        image_url: "/site-images/gombe1.png",
        client_feedback: "We originally worried whether our factory roof could hold 80+ panels safely during stormy seasons. The engineering report and wind simulation put our board at complete ease.",
        client_rating: 5,
        resolution_note: "Structural Load Safety Factor: 2.5x High-Wind Rating",
        likes_count: 176,
        loves_count: 59,
        shares_count: 39,
        comments: [],
        created_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString()
    },
    {
        id: "post-106",
        engineer_name: "Engr. Solomon Abdulrasaq",
        engineer_title: "Certified Infrastructure Lead",
        engineer_avatar: "/site-images/instalerface.jpeg",
        stage: "stage2",
        stage_title: "🛠️ Stage 2: Trenching & Conduit",
        location: "Challawa Industrial Layout, Kano State",
        description: "Underground armoured DC and AC cable pathways laid in heavy-duty PVC electrical conduits with warning tape embedded 400mm above trench beds. Terminated neatly into IP66 weatherproof distribution junction boxes with moisture desiccant seals.",
        tags: ["IP66 Waterproof Ingress", "Subterranean Conduit Line", "Armoured 4-Core XLPE"],
        image_url: "/site-images/installer1.jpeg",
        client_feedback: "We had complaints in the past with previous contractors leaving exposed wires across our factory walkways. AE Renewable did proper underground trenching and restored the interlocks completely. Excellent work.",
        client_rating: 5,
        resolution_note: "Compliant Industrial Workplace Safety Sign-off",
        likes_count: 194,
        loves_count: 67,
        shares_count: 43,
        comments: [],
        created_at: new Date(Date.now() - 96 * 3600 * 1000).toISOString()
    }
];

// Initialize table if needed
async function ensureFieldTable() {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS field_posts (
                id VARCHAR(64) PRIMARY KEY,
                engineer_name VARCHAR(255) NOT NULL,
                engineer_title VARCHAR(255),
                engineer_avatar VARCHAR(500),
                stage VARCHAR(64) NOT NULL,
                stage_title VARCHAR(255) NOT NULL,
                location VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                tags JSONB DEFAULT '[]'::jsonb,
                image_url VARCHAR(500),
                client_feedback TEXT,
                client_rating INT DEFAULT 5,
                resolution_note VARCHAR(500),
                likes_count INT DEFAULT 0,
                loves_count INT DEFAULT 0,
                shares_count INT DEFAULT 0,
                comments JSONB DEFAULT '[]'::jsonb,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Check if empty, seed defaults
        const countRes = await query(`SELECT COUNT(*) as cnt FROM field_posts`);
        if (Number(countRes.rows[0]?.cnt || 0) === 0) {
            for (const p of DEFAULT_POSTS) {
                await query(`
                    INSERT INTO field_posts (
                        id, engineer_name, engineer_title, engineer_avatar, stage, stage_title,
                        location, description, tags, image_url, client_feedback, client_rating,
                        resolution_note, likes_count, loves_count, shares_count, comments, created_at
                    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
                `, [
                    p.id, p.engineer_name, p.engineer_title, p.engineer_avatar, p.stage, p.stage_title,
                    p.location, p.description, JSON.stringify(p.tags), p.image_url, p.client_feedback,
                    p.client_rating, p.resolution_note, p.likes_count, p.loves_count, p.shares_count,
                    JSON.stringify(p.comments), p.created_at
                ]);
            }
        }
    } catch (e) {
        console.warn("[FieldPost] Table init notice:", e.message);
    }
}

// Run table check
ensureFieldTable();

/* =========================================================
   CONTROLLERS
   ========================================================= */

async function getFieldPosts(req, res, next) {
    try {
        await ensureFieldTable();
        const { stage, search } = req.query;
        let sql = `SELECT * FROM field_posts WHERE 1=1`;
        const params = [];

        if (stage && stage !== "all") {
            params.push(stage);
            sql += ` AND LOWER(stage) = LOWER($${params.length})`;
        }

        if (search) {
            params.push(`%${search.toLowerCase().trim()}%`);
            sql += ` AND (LOWER(location) LIKE $${params.length} OR LOWER(description) LIKE $${params.length} OR LOWER(engineer_name) LIKE $${params.length})`;
        }

        sql += ` ORDER BY created_at DESC`;

        const result = await query(sql, params);
        const posts = result.rows.map(row => ({
            ...row,
            tags: typeof row.tags === "string" ? JSON.parse(row.tags) : (row.tags || []),
            comments: typeof row.comments === "string" ? JSON.parse(row.comments) : (row.comments || [])
        }));

        return res.status(200).json({
            success: true,
            count: posts.length,
            data: posts.length ? posts : DEFAULT_POSTS
        });
    } catch (error) {
        return res.status(200).json({
            success: true,
            count: DEFAULT_POSTS.length,
            data: DEFAULT_POSTS
        });
    }
}

async function createFieldPost(req, res, next) {
    try {
        await ensureFieldTable();
        const body = req.body || {};
        
        let imageUrl = body.imageUrl || "/site-images/panelUtako1.jpeg";
        let engineerAvatar = body.engineerAvatar || "/site-images/instalerface.jpeg";

        if (req.files) {
            if (req.files.image && req.files.image[0]) {
                imageUrl = `/uploads/${req.files.image[0].filename}`;
            }
            if (req.files.avatar && req.files.avatar[0]) {
                engineerAvatar = `/uploads/${req.files.avatar[0].filename}`;
            }
        } else if (req.file) {
            imageUrl = `/uploads/${req.file.filename}`;
        }

        const engineerName = body.engineerName;
        const engineerTitle = body.engineerTitle || "Certified Solar Specialist";
        const stage = body.stage || "stage3";
        const stageTitle = body.stageTitle;
        const location = body.location;
        const description = body.description;
        const tags = body.tags || [];
        const clientFeedback = body.clientFeedback;
        const clientRating = body.clientRating || 5;
        const resolutionNote = body.resolutionNote;

        if (!engineerName || !location || !description) {
            return res.status(400).json({
                success: false,
                message: "Engineer name, location, and post description are required."
            });
        }

        const STAGE_TITLES = {
            stage1: "🔍 Stage 1: Site Audit & Structural",
            stage2: "🛠️ Stage 2: Trenching & Conduit",
            stage3: "⚡ Stage 3: PV & Inverter Mount",
            stage4: "🔋 Stage 4: Battery & BMS Wiring",
            stage5: "⚡ Stage 5: Earthing (<2Ω) & SPDs",
            stage6: "🏆 Stage 6: Testing & Handover"
        };

        const resolvedStageTitle = stageTitle || STAGE_TITLES[stage] || `Stage: ${stage}`;
        const newId = `post-${Date.now()}`;
        const parsedTags = Array.isArray(tags) ? tags : String(tags).split(",").map(t => t.trim()).filter(Boolean);

        const insertRes = await query(`
            INSERT INTO field_posts (
                id, engineer_name, engineer_title, engineer_avatar, stage, stage_title,
                location, description, tags, image_url, client_feedback, client_rating,
                resolution_note, likes_count, loves_count, shares_count, comments, created_at
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,0,0,0,'[]'::jsonb,CURRENT_TIMESTAMP)
            RETURNING *
        `, [
            newId,
            engineerName,
            engineerTitle,
            engineerAvatar,
            stage,
            resolvedStageTitle,
            location,
            description,
            JSON.stringify(parsedTags),
            imageUrl,
            clientFeedback || "Verified client milestone sign-off and satisfaction confirmed.",
            Number(clientRating) || 5,
            resolutionNote || "Audited & Certified by AE Renewable Operations"
        ]);

        return res.status(201).json({
            success: true,
            message: "Live field post published successfully!",
            data: insertRes.rows[0]
        });
    } catch (error) {
        next(error);
    }
}

async function deleteFieldPost(req, res, next) {
    try {
        const { id } = req.params;
        await query(`DELETE FROM field_posts WHERE id = $1`, [id]);
        return res.status(200).json({
            success: true,
            message: "Field post removed successfully."
        });
    } catch (error) {
        next(error);
    }
}

async function reactToPost(req, res, next) {
    try {
        const { id } = req.params;
        const { type } = req.body; // 'like' or 'love'
        const column = type === "love" ? "loves_count" : "likes_count";
        
        const updateRes = await query(`
            UPDATE field_posts 
            SET ${column} = ${column} + 1 
            WHERE id = $1 
            RETURNING *
        `, [id]);

        return res.status(200).json({
            success: true,
            data: updateRes.rows[0]
        });
    } catch (error) {
        next(error);
    }
}

async function addComment(req, res, next) {
    try {
        const { id } = req.params;
        const { author = "Community Visitor", text } = req.body;

        if (!text) {
            return res.status(400).json({ success: false, message: "Comment text is required." });
        }

        const newComment = {
            author,
            text,
            avatar: author.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "U",
            date: new Date().toISOString()
        };

        const updateRes = await query(`
            UPDATE field_posts 
            SET comments = COALESCE(comments, '[]'::jsonb) || $1::jsonb 
            WHERE id = $2 
            RETURNING *
        `, [JSON.stringify([newComment]), id]);

        return res.status(200).json({
            success: true,
            data: newComment
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getFieldPosts,
    createFieldPost,
    deleteFieldPost,
    reactToPost,
    addComment
};
