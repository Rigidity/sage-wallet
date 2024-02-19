-- Add migration script here
CREATE TABLE `derivations` (
    `index` INT NOT NULL,
    `public_key` BLOB NOT NULL,
    `puzzle_hash` BLOB NOT NULL,
    PRIMARY KEY (`index`)
);
