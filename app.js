// Mengimpor modul Express.js
const express = require('express');

const expressLayouts = require('express-ejs-layouts'); // Mengimpor modul express-ejs-layouts

const { loadContact, findContact, addContact, cekDuplikat, deleteContact, updateContacts } = require('./utils/contacts');

const { body, validationResult, check } = require('express-validator');

const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');



// Menginisialisasi aplikasi Express
const app = express();

// Menentukan port yang akan digunakan
const port = 3000;

const pool = require("./db")

app.use(express.json())

// Mengatur EJS sebagai template engine
app.set('view engine', 'ejs');

// built-in middleware
app.use(express.static('public'));

// Menggunakan express-ejs-layouts sebagai middleware
app.use(expressLayouts);

// Menggunakan express.urlencoded() dengan opsi extended yang eksplisit
app.use(express.urlencoded({ extended: true }));

// Konfigurasi Flash
app.use(cookieParser('secret'));
app.use(
    session({
        cookie: { maxAge: 6000},
        secret: 'secret',
        resave: true,
        saveUninitialized: true,
    })
);
app.use(flash());


// application level midleware
app.use((req, res, next) => {
    console.log('Time: ', Date.now());
    next();
})

// Menggunakan middleware untuk menyajikan file statis dari direktori saat ini
app.use(express.static(__dirname));

// Penanganan rute untuk halaman utama
app.get('/', (req, res) => {
    res.render('halaman utama', {
        layout: 'layout/main-layout',
        namaWeb: "Rafi'ul Huda",
        title: 'halaman utama',
        // titleh1: 'Halo, ini adalah halaman utama!',
        message: 'Saat ini Saya sedang Mengikuti coding Training backend di sinarmas land'
    });
});

app.get("/addsync", async (req, res) => {
    try{
        const nama = "rafiul"
        const email = "rafiul@gmail.com"
        const mobile = "081283288739"
        const newCont = await pool.query(
        `INSERT INTO contacts values ('${nama}', '${email}','${mobile}') RETURNING *`
        );
        res.json(newCont);
    }catch(err){
        console.log(err.message);
        res.status(500).send('<h1>Internal server error</h1>');
    }
});

app.get('/list', async (req, res) => {
    try{
        const contact = await pool.query(`SELECT * FROM contacts`)
        res.json(contact.rows)
    }catch (err){
        console.log(err.message);
    }
})

// Penanganan rute untuk halaman about
app.get('/about', (req, res) => {
    res.render('about', { 
        layout: 'layout/main-layout',
        title: "About"
     });
});

// Penanganan rute untuk halaman contact
app.get('/contact', async (req, res) => {

    try{
        const contactList = await pool.query("SELECT * FROM contacts");

        const contacts = contactList.rows;
        res.render('contact', {
            title: 'Kontak',
            contacts,
            msg: req.flash('msg'),
            layout: 'layout/main-layout',
        });
        
    }catch(err){
        console.error(err.message);
        res.render('contact', {
            title: 'Kontak',
            msg: 'Data Contact tidak tersedia.', // Pesan ketika data kosong
            layout: 'layout/main-layout',
            contacts: []
        });
    }
});


// Halaman form tambah data contct
app.get('/contact/add', (req, res) => {
    res.render('add-contact', {
        title: 'Form Tambah Data Contact',
        layout: 'layout/main-layout'
    })
});

// proses data contact
app.post('/contact', [
    body('nama').custom((value) => {
        const duplikat = cekDuplikat(value);
        if(duplikat){
            throw new Error('Nama contact sudah digunakan!')
        }
        return true;
    }),
    check('email', 'Email tidak valid!').isEmail(),
    check('mobile', 'Nomor Handphone tidak valid!').isMobilePhone('id-ID')
], (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        // return res.status(400).json({ errors: errors.array() });
        res.render('add-contact', {
            title: 'Form Tambah Data Contact',
            layout: 'layout/main-layout',
            errors: errors.array(),
        })
    }else{
        addContact(req.body);
        // Kirimkan flash message
        req.flash('msg', 'Data Contact Anda Berhasil ditambahkan!');
        res.redirect('/contact');
    }
})


// proses delete contact
app.get('/contact/delete/:nama', (req, res) =>{
    const contact = findContact(req.params.nama)

    // jika contact tidak ada
    if(!contact){
        res.status(404);
        res.status('<h1>404</h1>');
    }else{
        deleteContact(req.params.nama);
        req.flash('msg', 'Data Contact Anda Berhasil dihapuskan!');
        res.redirect('/contact');
    }
}) 

// Halaman form ubah data contct
app.get('/contact/edit/:nama', (req, res) => {
    const contact = findContact(req.params.nama);

    res.render('edit-contact', {
        title: 'Form Ubah Data Contact',
        layout: 'layout/main-layout',
        contact,
    })
});

// proses ubah data
app.post('/contact/update', [
    body('nama').custom((value, { req}) => {
        const duplikat = cekDuplikat(value);
        if(duplikat){
            throw new Error('Nama contact sudah digunakan!')
        }
        return true;
    }),
    check('email', 'Email tidak valid!').isEmail(),
    // body('mobile').custom((value) => {
    //     const duplikat = cekDuplikat(value);
    //     if(duplikat){
    //         throw new Error('Nomor contact sudah digunakan!')
    //     }
    //     return true;
    // }),
    // check('mobile', 'Nomor Handphone tidak valid!').isMobilePhone('id-ID').custom((value) => {
    //     const duplikatNomor = cekDuplikat(value, 'mobile');
    //     if (duplikatNomor) {
    //         throw new Error('Nomor Handphone sudah digunakan!');
    //     }
    //     return true;
    // }),
    check('mobile', 'Nomor Handphone tidak valid!').isMobilePhone('id-ID')
], (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        // return res.status(400).json({ errors: errors.array() });
        res.render('edit-contact', {
            title: 'Form Ubah Data Contact',
            layout: 'layout/main-layout',
            errors: errors.array(),
            contact: req.body,
        })
    }else{
        updateContacts(req.body);
        // Kirimkan flash message
        req.flash('msg', 'Data Contact Anda Berhasil diubah!');
        res.redirect('/contact');
    }
})

// halaman detail contact
app.get('/contact/:nama', async (req, res) => {
    const name = req.params.nama;
    
    const contacts = await loadContact();
    
    const contact = contacts.find((contact) => contact.nama === name);
    
    // // Memeriksa apakah ada data kontak
    // if (contact.length === 0) {
    //     // Jika tidak ada, menampilkan pesan bahwa belum ada kontak yang tersedia
    //     res.render('detail', {
    //         title: 'Halaman detail kontak',
    //         message: 'Maaf, Belum ada daftar kontak yang tersedia.'
    //     });
    // } else {
        // Jika ada, menampilkan data kontak di halaman kontak
        res.render('detail', {
            title: 'Halaman detail kontak',
            contact,
            layout: 'layout/main-layout',
        });
    }
);

// Penanganan rute dinamis untuk produk dengan parameter 'id' dan query 'category'
app.get('/product/:id', (req, res) => {
    res.send(`Product id: ${req.params.id} <br> Category id: ${req.query.Kategori}`);
});

// Penanganan rute untuk permintaan yang tidak cocok dengan rute lainnya (404 Not Found)
app.use('/', (req, res) => {
    res.status(404);
    res.send('page not found: 404');
});

// Server mendengarkan permintaan pada port yang telah ditentukan
app.listen(port, () => {
    // Pesan ini akan dicetak saat server berjalan
    console.log(`Server berjalan di http://localhost:${port}/`);
});