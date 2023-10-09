# -*- coding: utf-8 -*-
from setuptools import setup, find_packages

with open("requirements.txt") as f:
    install_requires = f.read().strip().split("\n")

# get version from __version__ variable in shoperprime/__init__.py
from shoperprime import __version__ as version

setup(
    name="shoperprime",
    version=version,
    description="ShoperPrime",
    author="Jawahar R Mallah",
    author_email="connect@ShoperSolutions.com",
    packages=find_packages(),
    zip_safe=False,
    include_package_data=True,
    install_requires=install_requires,
)
