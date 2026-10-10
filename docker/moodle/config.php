<?php
// Moodle configuration for the local Docker environment.
//
// This file is mounted read-only into the container as /var/www/html/config.php,
// so the Moodle source in moodle/ stays untouched. Every value comes from
// environment variables defined in .env (see .env.example); there are no
// secrets here.

unset($CFG);
global $CFG;
$CFG = new stdClass();

/**
 * Returns a required environment variable or stops with a clear message.
 */
function cubik_env(string $name, ?string $default = null): string {
    $value = getenv($name);
    if ($value === false || $value === '') {
        if ($default !== null) {
            return $default;
        }
        http_response_code(500);
        exit("Missing required environment variable: {$name}\n");
    }
    return $value;
}

// Database.
$CFG->dbtype    = 'pgsql';
$CFG->dblibrary = 'native';
$CFG->dbhost    = cubik_env('MOODLE_DB_HOST', 'db');
$CFG->dbname    = cubik_env('MOODLE_DB_NAME');
$CFG->dbuser    = cubik_env('MOODLE_DB_USER');
$CFG->dbpass    = cubik_env('MOODLE_DB_PASSWORD');
$CFG->prefix    = cubik_env('MOODLE_DB_PREFIX', 'mdl_');
$CFG->dboptions = [
    'dbpersist' => 0,
    'dbport'    => (int) cubik_env('MOODLE_DB_PORT', '5432'),
    'dbsocket'  => '',
];

// Site location. wwwroot must match the URL used in the browser exactly.
$CFG->wwwroot  = rtrim(cubik_env('MOODLE_WWWROOT'), '/');
$CFG->dataroot = '/var/www/moodledata';
$CFG->admin    = 'admin';

$CFG->directorypermissions = 02777;

// The source tree is managed with Git, not from the web UI.
$CFG->disableupdateautodeploy = true;
$CFG->preventexecpath = true;

// Development debugging (local only).
if (cubik_env('MOODLE_DEBUG', 'false') === 'true') {
    @error_reporting(E_ALL);
    @ini_set('display_errors', '1');
    $CFG->debug = E_ALL;
    $CFG->debugdisplay = 1;
}

require_once(__DIR__ . '/lib/setup.php');

// There is no php closing tag in this file,
// it is intentional because it prevents trailing whitespace problems!
