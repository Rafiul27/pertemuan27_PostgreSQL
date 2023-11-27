const fs = require('fs');
const pool = require('../db.js')

const dirPath = './data';
if(!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
}


const dataPath = './data/contacts.json';
if(!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, '[]', 'utf-8');
}

const loadContact = async () => {
    // const fileBuffer = fs.readFileSync('data/contacts.json', 'utf-8');
    const connection = await pool.connect();
    const query = `SELECT * FROM contacts`;
    const results = await connection.query(query);
    const contacts = results.rows;
    // const contacts = JSON.parse(fileBuffer)
    return contacts;
}

const cariContact = async (nama) => {
    const contacts = await loadContact();
    const contact = contacts.find(
      (contact) => contact.nama.toLowerCase() === nama.toLowerCase()
    );
    return contact;
  };

// const findContact = (nama) => {
//     const contacts = loadContact();
//     const contact = contacts.find((contact) => contact.nama.toLowerCase() === nama.toLowerCase());
//     return contact;
// }

// menimpa file contacts.json dengan data yang baru
// const saveContacts = (contacts) => {
//     fs.writeFileSync('data/contacts.json', JSON.stringify(contacts));
// }

// menambahkan data contact baru 
const addContact = async (contact) => {
    // const contacts = loadContact();
    // contacts.push(contact);
    // saveContacts(contacts);
    const { nama, mobile, email } = contact;
    const connection = await pool.connect();
    const query = `
        INSERT INTO contacts (nama, mobile, email)
        VALUES ($1, $2, $3)
    `;
    await connection.query(query, [nama, mobile, email]);
}

// cek nama yang duplikat
const cekDuplikat = async (nama) => {
    const contacts = await loadContact();
    return contacts.find((contact) => contact.nama === nama);
}


// hapus contact
const deleteContact = async (nama) => {
    // const contacts = loadContact();
    // const filteredContacts = contacts.filter((contact) => contact.nama !== nama);
    // saveContacts(filteredContacts);
    const connection = await pool.connect();
    const query = `
        DELETE FROM contacts
        WHERE nama = $1
    `;
    await connection.query(query, [nama]);
} 

const cekemailDuplicat = async (email) => {
  const contacts = await loadContact();
  return contacts.find((contact) => contact.email === email);
};

// mengubah contacts
const updateContacts = async (contactBaru) => {
    // const contacts = loadContact();

    // hilangkan kontak lama yang namanya sama dengan oldNama
    // const filteredContacts = contacts.filter((contact) => contact.nama !== contactBaru.oldNama);
    // delete contactBaru.oldNama;
    // filteredContacts.push(contactBaru);
    // saveContacts(filteredContacts);
    const connection = await pool.connect();
    const query = `
        UPDATE contacts
        SET nama = $1, mobile = $2, email = $3
        WHERE nama = $4
    `;
    await connection.query(query, [
        contactBaru.nama,
        contactBaru.mobile,
        contactBaru.email,
        contactBaru.oldNama,
    ]);
}

module.exports = { loadContact, addContact, cekDuplikat, deleteContact, updateContacts, cariContact, cekemailDuplicat }