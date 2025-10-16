import subprocess
import sys
import re

def get_command(branch=None):
    arguments_list = ["git", "grep", "-P", rule_regex]

    if branch is not None:
        arguments_list.append(branch)

    arguments_list.append("--")
    arguments_list.append("scripts")
    arguments_list.append("./package.json")

    return arguments_list

## fetch upstream to be able to compare current commit to it
subprocess.call(["git", "remote", "add", "temp-remote", "https://github.com/superdesk/superdesk-client-core.git"], stderr=subprocess.STDOUT)
subprocess.call(["git", "fetch", "temp-remote", "--quiet"], stderr=subprocess.STDOUT)
develop_commit_with_ref = subprocess.check_output(["git", "ls-remote", "--heads", "temp-remote", "develop"]).decode('utf-8')
develop_commit = re.split('\t', develop_commit_with_ref)[0]
subprocess.call(["git", "remote", "remove", "temp-remote"], stderr=subprocess.STDOUT)
##

rules_to_check = [
    {
        'name': 'Do not use angularjs for views anymore. Use React components and use `reactToAngular1` if you need to use React components inside existing angular templates.',

        # must match:
        # template: 'test.html'
        # must not match:
        # template: 'test', a: '.html'
        'perl_regex': 'template\s*?:\s*[\'|"|`].+?\.html[\'|"|`]',
        'tolerance': True
    },
    {
        'name': 'Do not use angularjs for views anymore. Use React components and use `reactToAngular1` if you need to use React components inside existing angular templates.',

        # must match:
        # templateUrl: 'test.html'
        # must not match:
        # templateUrl: 'test', a: '.html'
        'perl_regex': 'templateUrl\s*?:\s*[\'|"|`].+?\.html[\'|"|`]',
        'tolerance': True
    },
    {
        'name': 'Do not use angularjs for views anymore. Use React components and use `reactToAngular1` if you need to use React components inside existing angular templates.',

        # must match:
        # template: '<'
        # must not match:
        # template: 'a', b: '<'
        'perl_regex': 'template\s*?:\s*[\'|"|`][^\'|"|`]*<[^\'|"|`]*[\'|"|`]',
        'tolerance': True
    },
    {
        'name': 'force exact ui-framework version',

        # errors if finds a caret or a tilde next to ui-framework version
        'perl_regex': '"superdesk-ui-framework": "(\^|~)',
        'tolerance': False
    },
]

any_rule_violated = False

for rule in rules_to_check:
    rule_regex = rule['perl_regex']
    rule_name = rule['name']

    # will not error if the amount of violations is less than on develop
    rule_tolerance = rule['tolerance']

    try:
        violations_count_develop = len(
            subprocess.check_output(get_command(develop_commit)).decode('utf-8').splitlines()
        )
    except subprocess.CalledProcessError as e:
        # ignore exception if grep simply didn't find matches
        if len(e.output) != 0:
            raise e
        else:
            violations_count_develop = 0


    try:
        violations = subprocess.check_output(get_command(), stderr=subprocess.STDOUT).decode('utf-8')
    except subprocess.CalledProcessError as e:
        # ignore exception if grep simply didn't find matches
        if len(e.output) != 0:
            raise e
        else:
            violations = ''

    violations_count = len(violations.splitlines())

    if (violations_count > 0 and rule_tolerance is False) or violations_count > violations_count_develop:
        any_rule_violated = True
        print('\n\n' + violations + '\n\n')
        print("GREP-LINT RULE VIOLATED! '" + rule_name + "'")
        print("Rule regex: `" + rule_regex + "`")

        if rule_tolerance is True:
            print('Tolerance is enabled, but ' + str(violations_count) + ' violations were found on this commit while there only are ' + str(violations_count_develop) + ' violations on develop. See grep-lint.py for details.')

sys.exit(1 if any_rule_violated else 0)
