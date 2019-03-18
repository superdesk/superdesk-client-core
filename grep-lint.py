import subprocess
import sys

def get_command(branch=None):
    branch_arg = '' if branch is None else f" {branch}"

    # git grep returns an error code when no matches are found
    # and subprocess.check_output throws an error when an error code is returned
    ignore_error = ' || true'
    
    return f"git grep -P '{rule_regex}'{branch_arg} -- 'scripts'{ignore_error}"

rules_to_check = [
    {
        # Translation strings can't be extracted when using translate filter, so we should no longer use it
        # Tolerance equal to the number of current occurences is put in place so we don't have to refactor everything at once.
        'name': 'Do not use `translate` filter',
        'perl_regex': '\|\s*?translate',

        # will not error if the amount of violations is less than on master
        'tolerance': True
    }
]

any_rule_violated = False

for rule in rules_to_check:
    rule_regex = rule['perl_regex']
    rule_name = rule['name']
    rule_tolerance = rule['tolerance']

    violations_count_master = len(
        subprocess.check_output(get_command("master"), shell=True, stderr=subprocess.STDOUT).decode('utf-8').splitlines()
    )

    violations = subprocess.check_output(get_command(), shell=True, stderr=subprocess.STDOUT).decode('utf-8')

    violations_count = len(violations.splitlines())

    if((violations_count > 0 and rule_tolerance is False) or violations_count > violations_count_master):
        any_rule_violated = True
        print(f'\n\n{violations}\n\n')
        print(f"GREP-LINT RULE VIOLATED! '{rule_name}'")
        print(f"Rule regex: `{rule_regex}`")

        if (rule_tolerance is True):
            print(f'Tolerance is enabled, but {violations_count} violations were found in the working while there only are {violations_count_master} violations on master. See grep-lint.py for details.')

sys.exit(1 if any_rule_violated else 0)