# -*- coding: utf-8 -*-
from setuptools import setup, find_packages

with open("requirements.txt") as f:
    install_requires = f.read().strip().split("\n")

# get version from __version__ variable in shoperprimepos/__init__.py
from shoperprimepos import __version__ as version

setup(
    name="shoperprimepos",
    version=version,
    description="ShoperPrime POS",
    author="Jawahar R Mallah",
    author_email="netmanthan@outlook.com",
    packages=find_packages(),
    zip_safe=False,
    include_package_data=True,
    install_requires=install_requires,
)
