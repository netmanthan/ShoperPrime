from setuptools import setup, find_packages

with open("requirements.txt") as f:
	install_requires = f.read().strip().split("\n")

# get version from __version__ variable in shopperprime/__init__.py
from shopperprime import __version__ as version

setup(
	name="shopperprime",
	version=version,
	description="online Retail Point Of Sale",
	author="Netmanthan",
	author_email="connect@netmanthan.com",
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires
)
