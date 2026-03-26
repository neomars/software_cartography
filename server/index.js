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
    const newSoftware = { id: uuidv4(), children: [], parent_id: null, ...req.body };
    db.softwares.push(newSoftware);

    if (newSoftware.parent_id) {
        const parentService = db.services.find(s => s.id === newSoftware.parent_id);
        if (parentService && !parentService.children.includes(newSoftware.id)) {
            parentService.children.push(newSoftware.id);
        }
        const parentSw = db.softwares.find(s => s.id === newSoftware.parent_id);
        if (parentSw && !parentSw.children.includes(newSoftware.id)) {
            parentSw.children.push(newSoftware.id);
        }
    }

    if (newSoftware.children) {
        newSoftware.children.forEach(childId => {
            const childSw = db.softwares.find(s => s.id === childId);
            if (childSw) childSw.parent_id = newSoftware.id;
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
        const newSoftware = { ...oldSoftware, children: oldSoftware.children || [], ...req.body };

        if (oldSoftware.parent_id !== newSoftware.parent_id) {
            // Remove from all potential parents (cleanup)
            db.services.forEach(s => {
                s.children = (s.children || []).filter(id => id !== req.params.id);
            });
            db.softwares.forEach(s => {
                s.children = (s.children || []).filter(id => id !== req.params.id);
            });

            if (newSoftware.parent_id) {
                const newService = db.services.find(s => s.id === newSoftware.parent_id);
                if (newService) {
                    if (!newService.children) newService.children = [];
                    if (!newService.children.includes(req.params.id)) {
                        newService.children.push(req.params.id);
                    }
                }
                const newParentSw = db.softwares.find(s => s.id === newSoftware.parent_id);
                if (newParentSw) {
                    if (!newParentSw.children) newParentSw.children = [];
                    if (!newParentSw.children.includes(req.params.id)) {
                        newParentSw.children.push(req.params.id);
                    }
                }
            }
        }

        if (newSoftware.children) {
            oldSoftware.children?.forEach(childId => {
                if (!newSoftware.children.includes(childId)) {
                    const childSw = db.softwares.find(s => s.id === childId);
                    if (childSw) childSw.parent_id = null;
                }
            });
            newSoftware.children.forEach(childId => {
                const childSw = db.softwares.find(s => s.id === childId);
                if (childSw) childSw.parent_id = newSoftware.id;
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
        if (softwareToDelete.parent_id) {
            const parentService = db.services.find(s => s.id === softwareToDelete.parent_id);
            if (parentService) {
                parentService.children = parentService.children.filter(id => id !== req.params.id);
            }
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
    const newService = { id: uuidv4(), name: '', color: '#3b82f6', children: [], parent_id: null, ...req.body };
    db.services.push(newService);

    if (newService.parent_id) {
        const parentSrv = db.services.find(s => s.id === newService.parent_id);
        if (parentSrv && !parentSrv.children.includes(newService.id)) {
            parentSrv.children.push(newService.id);
        }
    }

    newService.children.forEach(childId => {
        db.services.forEach(s => {
            if (s.id !== newService.id) {
                s.children = s.children.filter(id => id !== childId);
            }
        });
        const software = db.softwares.find(s => s.id === childId);
        if (software) {
            if (software.parent_id && software.parent_id !== newService.id) {
                const oldParentSrv = db.services.find(s => s.id === software.parent_id);
                if (oldParentSrv) oldParentSrv.children = oldParentSrv.children.filter(id => id !== childId);
                const oldParentSw = db.softwares.find(s => s.id === software.parent_id);
                if (oldParentSw) oldParentSw.children = oldParentSw.children.filter(id => id !== childId);
            }
            software.parent_id = newService.id;
        }
        const service = db.services.find(s => s.id === childId);
        if (service) {
            if (service.parent_id && service.parent_id !== newService.id) {
                const oldParentSrv = db.services.find(s => s.id === service.parent_id);
                if (oldParentSrv) oldParentSrv.children = oldParentSrv.children.filter(id => id !== childId);
            }
            service.parent_id = newService.id;
        }
    });

    writeDB(db);
    res.status(201).json(newService);
});

app.put('/api/services/:id', (req, res) => {
    console.log(`[API] PUT /api/services/${req.params.id}`, req.body);
    const db = readDB();
    const index = db.services.findIndex(s => s.id === req.params.id);
    if (index !== -1) {
        const oldService = db.services[index];
        const newService = { ...oldService, children: oldService.children || [], ...req.body };

        if (oldService.parent_id !== newService.parent_id) {
            // Remove from all potential parents (cleanup)
            db.services.forEach(s => {
                s.children = (s.children || []).filter(id => id !== req.params.id);
            });

            if (newService.parent_id) {
                const newParentService = db.services.find(s => s.id === newService.parent_id);
                if (newParentService) {
                    if (!newParentService.children) newParentService.children = [];
                    if (!newParentService.children.includes(req.params.id)) {
                        newParentService.children.push(req.params.id);
                    }
                }
            }
        }

        (oldService.children || []).forEach(childId => {
            if (!newService.children.includes(childId)) {
                const software = db.softwares.find(s => s.id === childId);
                if (software) software.parent_id = null;
                const service = db.services.find(s => s.id === childId);
                if (service) service.parent_id = null;
            }
        });

        (newService.children || []).forEach(childId => {
            db.services.forEach((s, idx) => {
                if (s.id !== newService.id) {
                    db.services[idx].children = (s.children || []).filter(id => id !== childId);
                }
            });

            const software = db.softwares.find(s => s.id === childId);
            if (software) {
                if (software.parent_id && software.parent_id !== newService.id) {
                    const oldParentSrv = db.services.find(s => s.id === software.parent_id);
                    if (oldParentSrv) oldParentSrv.children = (oldParentSrv.children || []).filter(id => id !== childId);
                    const oldParentSw = db.softwares.find(s => s.id === software.parent_id);
                    if (oldParentSw) oldParentSw.children = (oldParentSw.children || []).filter(id => id !== childId);
                }
                software.parent_id = newService.id;
            }
            const service = db.services.find(s => s.id === childId);
            if (service) {
                if (service.parent_id && service.parent_id !== newService.id) {
                    const oldParentSrv = db.services.find(s => s.id === service.parent_id);
                    if (oldParentSrv) oldParentSrv.children = (oldParentSrv.children || []).filter(id => id !== childId);
                }
                service.parent_id = newService.id;
            }
        });

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
        serviceToDelete.children.forEach(childId => {
            const software = db.softwares.find(s => s.id === childId);
            if (software) software.parent_id = null;
            const service = db.services.find(s => s.id === childId);
            if (service) service.parent_id = null;
        });
        db.services = db.services.filter(s => s.id !== req.params.id);
        db.services.forEach(service => {
            service.children = service.children.filter(childId => childId !== req.params.id);
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
