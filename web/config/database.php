<?php
// Elit Bilişim - POS Sistemi
// Veritabanı Bağlantı Ayarları

class Database {
    private $host = "localhost";
    private $db_name = "elitmedy_pos";
    private $username = "elitmedy_user";
    private $password = "vT7#pLx9@QmZ!2rW$eB6^uJfA1&nK3*XyC0+gHsMd8~oIqVzEtRbYlUwNjD";
    private $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8",
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            echo "Bağlantı hatası: " . $e->getMessage();
        }
        return $this->conn;
    }
}
?>