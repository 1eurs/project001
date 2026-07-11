-- Loyalty rewards become a list: the café picks a set of menu items and the
-- customer chooses ONE of them free when redeeming a completed card.
-- Replaces the single loyalty_programs.reward_item_id column.

CREATE TABLE loyalty_reward_items (
    program_id    BIGINT NOT NULL REFERENCES loyalty_programs (id) ON DELETE CASCADE,
    -- deleting a menu item simply drops it from the reward list.
    menu_item_id  BIGINT NOT NULL REFERENCES menu_items (id) ON DELETE CASCADE,
    PRIMARY KEY (program_id, menu_item_id)
);

INSERT INTO loyalty_reward_items (program_id, menu_item_id)
SELECT id, reward_item_id FROM loyalty_programs WHERE reward_item_id IS NOT NULL;

ALTER TABLE loyalty_programs DROP COLUMN reward_item_id;
