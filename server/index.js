const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const csv = require('csv-parser');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ softwares: [], services: [], settings: { appName: 'Viz3D' } }, null, 2));
} else {
    const db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    if (!db.settings) {
        db.settings = { appName: 'Viz3D' };
        fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
    }
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname))
});
const upload = multer({ storage });

function readDB() {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeDB(data) {
    console.log(`[DB] Writing to ${DATA_FILE}`);
    // Using stringify with null, 2 for readability.
    // No special handling needed for unicode as JSON.stringify handles it,
    // but we can ensure it's written as UTF-8.
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/softwares', (req, res) => {
    const db = readDB();
    res.json(db.softwares);
});

app.post('/api/softwares', (req, res) => {
    const db = readDB();
    const newSoftware = { id: uuidv4(), children: [], parent_id: null, parent_ids: [], ...req.body };

    // Support both single parent_id and multiple parent_ids
    const allParentIds = new Set(newSoftware.parent_ids || []);
    if (newSoftware.parent_id) allParentIds.add(newSoftware.parent_id);
    newSoftware.parent_ids = Array.from(allParentIds);
    newSoftware.parent_id = newSoftware.parent_ids[0] || null;

    db.softwares.push(newSoftware);

    newSoftware.parent_ids.forEach(pId => {
        const parentService = db.services.find(s => s.id === pId);
        if (parentService && !parentService.children.includes(newSoftware.id)) {
            parentService.children.push(newSoftware.id);
        }
        const parentSw = db.softwares.find(s => s.id === pId);
        if (parentSw && !parentSw.children.includes(newSoftware.id)) {
            parentSw.children.push(newSoftware.id);
        }
    });

    if (newSoftware.children) {
        newSoftware.children.forEach(childId => {
            const childSw = db.softwares.find(s => s.id === childId);
            if (childSw) {
                if (!childSw.parent_ids) childSw.parent_ids = [];
                if (!childSw.parent_ids.includes(newSoftware.id)) childSw.parent_ids.push(newSoftware.id);
                childSw.parent_id = childSw.parent_ids[0] || null;
            }
        });
    }

    writeDB(db);
    res.status(201).json(newSoftware);
});

app.put('/api/softwares/:id', (req, res) => {
    console.log(`[API] PUT /api/softwares/${req.params.id}`, req.body);
    const db = readDB();
    const index = db.softwares.findIndex(s => s.id === req.params.id);
    if (index !== -1) {
        const oldSoftware = db.softwares[index];
        const newSoftware = {
            ...oldSoftware,
            children: oldSoftware.children || [],
            parent_ids: oldSoftware.parent_ids || [],
            ...req.body
        };

        const oldParents = new Set(oldSoftware.parent_ids || []);
        if (oldSoftware.parent_id) oldParents.add(oldSoftware.parent_id);

        const newParents = new Set(newSoftware.parent_ids || []);
        if (newSoftware.parent_id) newParents.add(newSoftware.parent_id);
        newSoftware.parent_ids = Array.from(newParents);
        newSoftware.parent_id = newSoftware.parent_ids[0] || null;

        // Remove from old parents that are not in new parents
        oldParents.forEach(pId => {
            if (!newParents.has(pId)) {
                const srv = db.services.find(s => s.id === pId);
                if (srv) srv.children = (srv.children || []).filter(id => id !== req.params.id);
                const sw = db.softwares.find(s => s.id === pId);
                if (sw) sw.children = (sw.children || []).filter(id => id !== req.params.id);
            }
        });

        // Add to new parents
        newParents.forEach(pId => {
            const srv = db.services.find(s => s.id === pId);
            if (srv && !(srv.children || []).includes(req.params.id)) {
                if (!srv.children) srv.children = [];
                srv.children.push(req.params.id);
            }
            const sw = db.softwares.find(s => s.id === pId);
            if (sw && !(sw.children || []).includes(req.params.id)) {
                if (!sw.children) sw.children = [];
                sw.children.push(req.params.id);
            }
        });

        if (newSoftware.children) {
            oldSoftware.children?.forEach(childId => {
                if (!newSoftware.children.includes(childId)) {
                    const childSw = db.softwares.find(s => s.id === childId);
                    if (childSw) {
                        childSw.parent_ids = (childSw.parent_ids || []).filter(id => id !== req.params.id);
                        childSw.parent_id = childSw.parent_ids[0] || null;
                    }
                }
            });
            newSoftware.children.forEach(childId => {
                const childSw = db.softwares.find(s => s.id === childId);
                if (childSw) {
                    if (!childSw.parent_ids) childSw.parent_ids = [];
                    if (!childSw.parent_ids.includes(newSoftware.id)) childSw.parent_ids.push(newSoftware.id);
                    childSw.parent_id = childSw.parent_ids[0] || null;
                }
            });
        }

        db.softwares[index] = newSoftware;
        writeDB(db);
        res.json(db.softwares[index]);
    } else {
        res.status(404).send('Software not found');
    }
});

app.delete('/api/softwares/:id', (req, res) => {
    const db = readDB();
    const softwareToDelete = db.softwares.find(s => s.id === req.params.id);
    if (softwareToDelete) {
        // Handle children
        if (softwareToDelete.children) {
            softwareToDelete.children.forEach(childId => {
                const childSw = db.softwares.find(s => s.id === childId);
                if (childSw) {
                    childSw.parent_ids = (childSw.parent_ids || []).filter(id => id !== req.params.id);
                    childSw.parent_id = childSw.parent_ids[0] || null;
                }
                const childSrv = db.services.find(s => s.id === childId);
                if (childSrv) {
                    childSrv.parent_ids = (childSrv.parent_ids || []).filter(id => id !== req.params.id);
                    childSrv.parent_id = childSrv.parent_ids[0] || null;
                }
            });
        }

        db.softwares = db.softwares.filter(s => s.id !== req.params.id);
        db.softwares.forEach(sw => {
            if (sw.children) sw.children = sw.children.filter(childId => childId !== req.params.id);
        });
        db.services.forEach(service => {
            service.children = service.children.filter(childId => childId !== req.params.id);
        });
        writeDB(db);
    }
    res.status(204).send();
});

app.get('/api/services', (req, res) => {
    const db = readDB();
    res.json(db.services);
});

app.post('/api/services', (req, res) => {
    const db = readDB();
    const newService = { id: uuidv4(), name: '', color: '#3b82f6', children: [], parent_id: null, parent_ids: [], ...req.body };

    // Support both single parent_id and multiple parent_ids
    const allParentIds = new Set(newService.parent_ids || []);
    if (newService.parent_id) allParentIds.add(newService.parent_id);
    newService.parent_ids = Array.from(allParentIds);
    newService.parent_id = newService.parent_ids[0] || null;

    db.services.push(newService);

    newService.parent_ids.forEach(pId => {
        const parentSrv = db.services.find(s => s.id === pId);
        if (parentSrv && !parentSrv.children.includes(newService.id)) {
            parentSrv.children.push(newService.id);
        }
        const parentSw = db.softwares.find(s => s.id === pId);
        if (parentSw && !parentSw.children.includes(newService.id)) {
            parentSw.children.push(newService.id);
        }
    });

    if (newService.children) {
        newService.children.forEach(childId => {
            const childSw = db.softwares.find(s => s.id === childId);
            if (childSw) {
                childSw.parent_id = newService.id;
                if (!childSw.parent_ids) childSw.parent_ids = [];
                if (!childSw.parent_ids.includes(newService.id)) childSw.parent_ids.push(newService.id);
            }
            const childSrv = db.services.find(s => s.id === childId);
            if (childSrv) {
                childSrv.parent_id = newService.id;
                if (!childSrv.parent_ids) childSrv.parent_ids = [];
                if (!childSrv.parent_ids.includes(newService.id)) childSrv.parent_ids.push(newService.id);
            }
        });
    }

    writeDB(db);
    res.status(201).json(newService);
});

app.put('/api/services/:id', (req, res) => {
    console.log(`[API] PUT /api/services/${req.params.id}`, req.body);
    const db = readDB();
    const index = db.services.findIndex(s => s.id === req.params.id);
    if (index !== -1) {
        const oldService = db.services[index];
        const newService = {
            ...oldService,
            children: oldService.children || [],
            parent_ids: oldService.parent_ids || [],
            ...req.body
        };

        const oldParents = new Set(oldService.parent_ids || []);
        if (oldService.parent_id) oldParents.add(oldService.parent_id);

        const newParents = new Set(newService.parent_ids || []);
        if (newService.parent_id) newParents.add(newService.parent_id);
        newService.parent_ids = Array.from(newParents);
        newService.parent_id = newService.parent_ids[0] || null;

        // Remove from old parents that are not in new parents
        oldParents.forEach(pId => {
            if (!newParents.has(pId)) {
                const srv = db.services.find(s => s.id === pId);
                if (srv) srv.children = (srv.children || []).filter(id => id !== req.params.id);
                const sw = db.softwares.find(s => s.id === pId);
                if (sw) sw.children = (sw.children || []).filter(id => id !== req.params.id);
            }
        });

        // Add to new parents
        newParents.forEach(pId => {
            const srv = db.services.find(s => s.id === pId);
            if (srv && !(srv.children || []).includes(req.params.id)) {
                if (!srv.children) srv.children = [];
                srv.children.push(req.params.id);
            }
            const sw = db.softwares.find(s => s.id === pId);
            if (sw && !(sw.children || []).includes(req.params.id)) {
                if (!sw.children) sw.children = [];
                sw.children.push(req.params.id);
            }
        });

        if (newService.children) {
            oldService.children?.forEach(childId => {
                if (!newService.children.includes(childId)) {
                    const childSw = db.softwares.find(s => s.id === childId);
                    if (childSw) {
                        childSw.parent_ids = (childSw.parent_ids || []).filter(id => id !== req.params.id);
                        childSw.parent_id = childSw.parent_ids[0] || null;
                    }
                    const childSrv = db.services.find(s => s.id === childId);
                    if (childSrv) {
                        childSrv.parent_ids = (childSrv.parent_ids || []).filter(id => id !== req.params.id);
                        childSrv.parent_id = childSrv.parent_ids[0] || null;
                    }
                }
            });
            newService.children.forEach(childId => {
                const childSw = db.softwares.find(s => s.id === childId);
                if (childSw) {
                    if (!childSw.parent_ids) childSw.parent_ids = [];
                    if (!childSw.parent_ids.includes(newService.id)) childSw.parent_ids.push(newService.id);
                    childSw.parent_id = childSw.parent_ids[0] || null;
                }
                const childSrv = db.services.find(s => s.id === childId);
                if (childSrv) {
                    if (!childSrv.parent_ids) childSrv.parent_ids = [];
                    if (!childSrv.parent_ids.includes(newService.id)) childSrv.parent_ids.push(newService.id);
                    childSrv.parent_id = childSrv.parent_ids[0] || null;
                }
            });
        }

        db.services[index] = newService;
        writeDB(db);
        res.json(newService);
    } else {
        res.status(404).send('Service not found');
    }
});

app.delete('/api/services/:id', (req, res) => {
    const db = readDB();
    const serviceToDelete = db.services.find(s => s.id === req.params.id);
    if (serviceToDelete) {
        // Handle children
        if (serviceToDelete.children) {
            serviceToDelete.children.forEach(childId => {
                const childSw = db.softwares.find(s => s.id === childId);
                if (childSw) {
                    childSw.parent_ids = (childSw.parent_ids || []).filter(id => id !== req.params.id);
                    childSw.parent_id = childSw.parent_ids[0] || null;
                }
                const childSrv = db.services.find(s => s.id === childId);
                if (childSrv) {
                    childSrv.parent_ids = (childSrv.parent_ids || []).filter(id => id !== req.params.id);
                    childSrv.parent_id = childSrv.parent_ids[0] || null;
                }
            });
        }

        db.services = db.services.filter(s => s.id !== req.params.id);
        db.services.forEach(service => {
            service.children = (service.children || []).filter(childId => childId !== req.params.id);
        });
        db.softwares.forEach(sw => {
            if (sw.children) sw.children = sw.children.filter(childId => childId !== req.params.id);
        });
        writeDB(db);
    }
    res.status(204).send();
});

app.post('/api/import-csv', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded');
    const results = [];
    fs.createReadStream(req.file.path)
        .pipe(csv({
            separator: ',',
            mapHeaders: ({ header }) => header.trim(),
            mapValues: ({ value }) => value.trim()
        }))
        .on('data', (data) => results.push(data))
        .on('end', () => {
            const db = readDB();
            results.forEach(row => {
                console.log('[Import] Processing row:', row);
                const name = row.Logiciels || row.software || row.Logiciel || 'Sans nom';
                const existingIndex = db.softwares.findIndex(s => s.name === name);

                const isTrue = (val) => {
                    if (!val) return false;
                    const v = String(val).toLowerCase().trim();
                    return v === 'true' || v === 'oui' || v === '1' || v === 'vrai';
                };

                // Try to find parent service if specified
                let parentId = existingIndex !== -1 ? db.softwares[existingIndex].parent_id : null;
                const serviceName = row.Service || row.service;
                if (serviceName) {
                    const parentService = db.services.find(s => s.name.toLowerCase().trim() === serviceName.toLowerCase().trim());
                    if (parentService) {
                        const newParentId = parentService.id;
                        // Cleanup: if the parent changed, remove from old parent
                        if (parentId && parentId !== newParentId) {
                            const oldParent = db.services.find(s => s.id === parentId);
                            if (oldParent) {
                                oldParent.children = (oldParent.children || []).filter(id => id !== (existingIndex !== -1 ? db.softwares[existingIndex].id : ''));
                            }
                        }
                        parentId = newParentId;
                        console.log(`[Import] Found parent service: ${parentService.name} (${parentId})`);
                    } else {
                        console.log(`[Import] Parent service not found: ${serviceName}`);
                    }
                }

                const software = {
                    id: existingIndex !== -1 ? db.softwares[existingIndex].id : uuidv4(),
                    name: name,
                    parent_id: parentId,
                    parent_ids: parentId ? [parentId] : (existingIndex !== -1 ? (db.softwares[existingIndex].parent_ids || []) : []),
                    children: existingIndex !== -1 ? (db.softwares[existingIndex].children || []) : [],
                    acces: isTrue(row['Accès']),
                    description: row.Description || (existingIndex !== -1 ? db.softwares[existingIndex].description : ''),
                    intranet: existingIndex !== -1 ? db.softwares[existingIndex].intranet : '',
                    sdan: existingIndex !== -1 ? db.softwares[existingIndex].sdan : '',
                    ministere: existingIndex !== -1 ? db.softwares[existingIndex].ministere : '',
                    logo: existingIndex !== -1 ? db.softwares[existingIndex].logo : null
                };

                if (existingIndex !== -1) {
                    db.softwares[existingIndex] = software;
                } else {
                    db.softwares.push(software);
                }

                // Update parent service children list
                if (parentId) {
                    const parentService = db.services.find(s => s.id === parentId);
                    if (parentService && !parentService.children.includes(software.id)) {
                        parentService.children.push(software.id);
                    }
                }
            });
            writeDB(db);
            fs.unlinkSync(req.file.path);
            res.json({ message: 'Import successful', count: results.length });
        });
});

app.post('/api/upload-logo/:type/:id', upload.single('logo'), (req, res) => {
    if (!req.file) return res.status(400).send('No logo uploaded');
    const { type, id } = req.params;
    const db = readDB();
    const logoUrl = `/uploads/${req.file.filename}`;
    if (type === 'software') {
        const software = db.softwares.find(s => s.id === id);
        if (software) { software.logo = logoUrl; writeDB(db); return res.json({ logoUrl }); }
    } else if (type === 'service') {
        const service = db.services.find(s => s.id === id);
        if (service) { service.logo = logoUrl; writeDB(db); return res.json({ logoUrl }); }
    }
    res.status(404).send('Not found');
});

app.get('/api/settings', (req, res) => {
    const db = readDB();
    res.json(db.settings || { appName: 'Viz3D' });
});

app.put('/api/settings', (req, res) => {
    const db = readDB();
    db.settings = { ...db.settings, ...req.body };
    writeDB(db);
    res.json(db.settings);
});

app.get('/api/data', (req, res) => res.json(readDB()));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
