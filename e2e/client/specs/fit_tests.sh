#!/bin/sh
set -ue
script_path="$(readlink -e $(dirname "${0}"))"

sed_expression="sed -r"

while IFS='' read -r test_name || [[ -n "${test_name}" ]]; do
	sed_expression="${sed_expression} -e \"s/ it\('${test_name}'/ fit('${test_name}'/g\""
done < ${script_path}/smoke_test.list

for file in ${script_path}/*.js ; do
	eval "${sed_expression} -i ${file}"
done
