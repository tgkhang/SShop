package com.xxxx.seed;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.ApplicationContext;
import org.springframework.boot.SpringApplication;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Database seeder — runs only when spring.profiles.active=seed.
 *
 * Usage:
 *   mvn spring-boot:run -pl xxxx-start -Dspring-boot.run.arguments="--spring.profiles.active=seed"
 * Or with the fat jar:
 *   java -jar xxxx-start/target/xxxx-start-1.0-SNAPSHOT.jar --spring.profiles.active=seed
 */
@Slf4j
@Component
@Profile("seed")
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final JdbcTemplate jdbc;
    private final ApplicationContext ctx;

    @Override
    public void run(String... args) {
        log.info("=== [SEED] Starting database seed ===");

        clearTables();
        seedTickets();
        seedTicketItems();

        log.info("=== [SEED] Done. Exiting. ===");
        System.exit(SpringApplication.exit(ctx, () -> 0));
    }

    // ------------------------------------------------------------------ //
    //  Clear
    // ------------------------------------------------------------------ //

    private void clearTables() {
        log.info("[SEED] Clearing tables...");
        jdbc.execute("SET FOREIGN_KEY_CHECKS = 0");
        jdbc.execute("DELETE FROM ticket_item");
        jdbc.execute("DELETE FROM ticket");
        jdbc.execute("ALTER TABLE ticket AUTO_INCREMENT = 1");
        jdbc.execute("ALTER TABLE ticket_item AUTO_INCREMENT = 1");
        jdbc.execute("SET FOREIGN_KEY_CHECKS = 1");
        log.info("[SEED] Tables cleared.");
    }

    // ------------------------------------------------------------------ //
    //  ticket
    // ------------------------------------------------------------------ //

    private void seedTickets() {
        String sql = """
                INSERT INTO ticket (name, `desc`, start_time, end_time, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, NOW(), NOW())
                """;

        List<Object[]> rows = List.of(
                new Object[]{"Đợt Mở Bán Vé Ngày 12/12",
                        "Sự kiện mở bán vé đặc biệt cho ngày 12/12",
                        "2024-12-12 00:00:00", "2024-12-12 23:59:59", 1},

                new Object[]{"Đợt Mở Bán Vé Ngày 01/01",
                        "Sự kiện mở bán vé cho ngày đầu năm mới 01/01",
                        "2025-01-01 00:00:00", "2025-01-01 23:59:59", 1}
        );

        jdbc.batchUpdate(sql, rows);
        log.info("[SEED] Inserted {} tickets.", rows.size());
    }

    // ------------------------------------------------------------------ //
    //  ticket_item
    // ------------------------------------------------------------------ //

    private void seedTicketItems() {
        String sql = """
                INSERT INTO ticket_item
                    (name, description, stock_initial, stock_available, is_stock_prepared,
                     price_original, price_flash, sale_start_time, sale_end_time,
                     status, activity_id, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                """;

        List<Object[]> rows = List.of(
                // 12/12 – standard
                new Object[]{"Vé Sự Kiện 12/12 - Hạng Phổ Thông",
                        "Vé phổ thông cho sự kiện ngày 12/12",
                        1000, 1000, false,
                        100000L, 10000L,
                        "2024-12-12 00:00:00", "2024-12-12 23:59:59", 1, 1L},

                // 12/12 – VIP
                new Object[]{"Vé Sự Kiện 12/12 - Hạng VIP",
                        "Vé VIP cho sự kiện ngày 12/12",
                        500, 500, false,
                        200000L, 15000L,
                        "2024-12-12 00:00:00", "2024-12-12 23:59:59", 1, 1L},

                // 01/01 – standard
                new Object[]{"Vé Sự Kiện 01/01 - Hạng Phổ Thông",
                        "Vé phổ thông cho sự kiện ngày 01/01",
                        2000, 2000, false,
                        100000L, 10000L,
                        "2025-01-01 00:00:00", "2025-01-01 23:59:59", 1, 2L},

                // 01/01 – VIP
                new Object[]{"Vé Sự Kiện 01/01 - Hạng VIP",
                        "Vé VIP cho sự kiện ngày 01/01",
                        1000, 1000, false,
                        200000L, 15000L,
                        "2025-01-01 00:00:00", "2025-01-01 23:59:59", 1, 2L}
        );

        jdbc.batchUpdate(sql, rows);
        log.info("[SEED] Inserted {} ticket items.", rows.size());
    }
}
