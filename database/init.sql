-- AKDoc AI Database Initialization
CREATE DATABASE akdoc_db;
CREATE USER akdoc WITH ENCRYPTED PASSWORD 'akdoc_pass';
GRANT ALL PRIVILEGES ON DATABASE akdoc_db TO akdoc;

-- Connect to akdoc_db
\c akdoc_db

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO akdoc;
