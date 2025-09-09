import 'dotenv/config';
import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const email = 'owner@example.com';
  const u = await pool.query(
    `insert into users (email, name) values ($1,$2)
     on conflict (email) do update set name=excluded.name
     returning id`, [email, 'Owner']
  );
  const ownerId = u.rows[0].id;
  const d = await pool.query(
    `insert into documents (owner_id, title, pdf_url)
     values ($1,$2,$3) returning id`,
     [ownerId, 'Test Doc', 'file:///tmp/placeholder.pdf']
  );
  const docId = d.rows[0].id;

  const s1 = await pool.query(
    `insert into signers (document_id, role_index, name, email, token_hash)
     values ($1,0,'Signer One','one@example.com','dev-hash-1') returning id`, [docId]
  );
  const s2 = await pool.query(
    `insert into signers (document_id, role_index, name, email, token_hash)
     values ($1,1,'Signer Two','two@example.com','dev-hash-2') returning id`, [docId]
  );

  await pool.query(
    `insert into fields (document_id, assigned_signer_id, type, page, x, y, w, h, required, placeholder, color, font_key, size_pt)
     values
     ($1,$2,'signature',1,0.32,0.44,0.25,0.08,true,null,'#111827',null,null),
     ($1,$3,'date',1,0.40,0.25,0.20,0.04,true,'YYYY-MM-DD','#16a34a','kalam',14)`,
    [docId, s1.rows[0].id, s2.rows[0].id]
  );

  console.log('Seeded { ownerId, docId }', { ownerId, docId });
  await pool.end();
}
main().catch(e => (console.error(e), process.exit(1)));


